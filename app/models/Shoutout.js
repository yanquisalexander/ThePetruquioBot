import { db } from "../../lib/database.js";
import Cache from "../Cache.js";

const SHOUTOUT_CACHE = new Cache();

class Shoutout {
    constructor(id, channel_id, target_streamer, message, enabled = true) {
        this.id = id;
        this.channel_id = channel_id;
        this.target_streamer = target_streamer;
        this.message = message;
        this.enabled = enabled;
    }

    static async create(channel_id, target_streamer, message) {
        try {
            const query = `
        INSERT INTO shoutouts (channel_id, target_streamer, message)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
            const values = [channel_id, target_streamer, message];
            const result = await db.query(query, values);
            const newShoutout = result.rows[0];
            let shoutout = new Shoutout(
                newShoutout.id,
                newShoutout.channel_id,
                newShoutout.target_streamer,
                newShoutout.message,
                newShoutout.enabled
            );
            SHOUTOUT_CACHE.set(`${channel_id}-${target_streamer}`, shoutout);
            return shoutout;
        } catch (error) {
            throw new Error('Error creating shoutout: ' + error.message);
        }
    }

    static async findByTargetStreamer(channel_id, target_streamer) {
        if (SHOUTOUT_CACHE.get(`${channel_id}-${target_streamer}`)) {
            return SHOUTOUT_CACHE.get(`${channel_id}-${target_streamer}`);
        }
        try {
            const query = 'SELECT * FROM shoutouts WHERE channel_id = $1 AND target_streamer = $2';
            const values = [channel_id, target_streamer];
            const result = await db.query(query, values);
            const shoutout = result.rows[0];
            if (!shoutout) {
                throw new Error('Shoutout not found');
            }
            let so = new Shoutout(
                shoutout.id,
                shoutout.channel_id,
                shoutout.target_streamer,
                shoutout.message,
                shoutout.enabled
            );
            SHOUTOUT_CACHE.set(`${channel_id}-${target_streamer}`, so);
            return so;
        } catch (error) {
            throw new Error('Error finding shoutout: ' + error.message);
        }
    }

    static async findById(id) {
        try {
            const query = 'SELECT * FROM shoutouts WHERE id = $1';
            const values = [id];
            const result = await db.query(query, values);
            const shoutout = result.rows[0];
            if (!shoutout) {
                throw new Error('Shoutout not found');
            }
            return new Shoutout(
                shoutout.id,
                shoutout.channel_id,
                shoutout.target_streamer,
                shoutout.message,
                shoutout.enabled
            );
        } catch (error) {
            throw new Error('Error finding shoutout: ' + error.message);
        }
    }

    static async findByChannel(channel_id) {
        try {
            const query = 'SELECT * FROM shoutouts WHERE channel_id = $1';
            const values = [channel_id];
            const result = await db.query(query, values);
            const shoutouts = result.rows.map((shoutout) => new Shoutout(
                shoutout.id,
                shoutout.channel_id,
                shoutout.target_streamer,
                shoutout.message,
                shoutout.enabled
            ));
            return shoutouts;
        } catch (error) {
            throw new Error('Error finding shoutouts: ' + error.message);
        }
    }

    async update(message, enabled) {
        try {
            const query = 'UPDATE shoutouts SET message = $1, enabled = $2 WHERE id = $3 RETURNING *';
            const values = [message, enabled, this.id];
            const result = await db.query(query, values);
            const updatedShoutout = result.rows[0];
            this.message = updatedShoutout.message;
            this.enabled = updatedShoutout.enabled;
            SHOUTOUT_CACHE.set(`${channel_id}-${this.target_streamer}`, this);
            return this;
        } catch (error) {
            throw new Error('Error updating shoutout: ' + error.message);
        }
    }

    async delete() {
        try {
            const query = 'DELETE FROM shoutouts WHERE id = $1';
            const values = [this.id];
            await db.query(query, values);
            SHOUTOUT_CACHE.remove(`${this.channel_id}-${this.target_streamer}`);
            return true;
        } catch (error) {
            throw new Error('Error deleting shoutout: ' + error.message);
        }
    }
}

export default Shoutout;
