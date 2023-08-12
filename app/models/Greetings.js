import chalk from "chalk";
import { db } from "../../lib/database.js";
import Cache from "../Cache.js";

export const GreetingsCache = new Cache();

setInterval(() => {
    GreetingsCache.clear();
    console.log(chalk.yellowBright('GREETINGS:' + chalk.greenBright(' Cache cleared successfully!')))
}, 1000 * 60 * 5);

class Greeting {
    constructor({ id, channel, lastSeen, shoutoutedAt, enabled }) {
        this.id = id;
        this.channel = channel;
        this.lastSeen = lastSeen;
        this.shoutoutedAt = shoutoutedAt;
        this.enabled = enabled;
    }



    static async create(username, channel) {
        try {
            const query = `
                INSERT INTO greetings (username, channel, last_seen)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const values = [username, channel, new Date()];
            const result = await db.query(query, values);
            const newGreeting = result.rows[0];
            return new Greeting(newGreeting);
        } catch (error) {
            throw new Error('Error creating greeting: ' + error.message);
        }
    }

    static async updateShoutoutTimestamp(username, channel) {
        try {
            const query = `
                UPDATE greetings
                SET shoutouted_at = $1
                WHERE username = $2 AND channel = $3
                RETURNING *
            `;
            const values = [new Date(), username, channel];
            const result = await db.query(query, values);
            const updatedGreeting = result.rows[0];
            return new Greeting({
                id: updatedGreeting.id,
                channel: updatedGreeting.channel,
                lastSeen: updatedGreeting.last_seen,
                shoutoutedAt: updatedGreeting.shoutouted_at,
                enabled: updatedGreeting.enabled,
            });
        } catch (error) {
            throw new Error('Error updating greeting: ' + error.message);
        }
    }

    static async updateTimestamp(username, channel) {
        try {
            const query = `
                UPDATE greetings
                SET last_seen = $1
                WHERE username = $2 AND channel = $3
                RETURNING *
            `;
            const values = [new Date(), username, channel];
            const result = await db.query(query, values);
            const updatedGreeting = result.rows[0];
            return new Greeting(updatedGreeting);
        } catch (error) {
            throw new Error('Error updating greeting: ' + error.message);
        }
    }


    static async findByChannel(username, channel) {
        if (GreetingsCache.get(`${username}-${channel}`)) {
            return new Greeting({
                id: GreetingsCache.get(`${username}-${channel}`).id,
                channel: GreetingsCache.get(`${username}-${channel}`).channel,
                lastSeen: GreetingsCache.get(`${username}-${channel}`).last_seen,
                shoutoutedAt: GreetingsCache.get(`${username}-${channel}`).shoutouted_at,
                enabled: GreetingsCache.get(`${username}-${channel}`).enabled,
            });
        }
        try {
            const query = `
                SELECT * FROM greetings
                WHERE username = $1 AND channel = $2
            `;
            const values = [username, channel];
            const result = await db.query(query, values);
            if (result.rows.length) {
                const greeting = result.rows[0];
                GreetingsCache.set(`${username}-${channel}`, greeting);
                return new Greeting({
                    id: greeting.id,
                    channel: greeting.channel,
                    lastSeen: greeting.last_seen,
                    shoutoutedAt: greeting.shoutouted_at,
                    enabled: greeting.enabled,
                });
            } else {
                // Create a new greeting data if one doesn't exist
                const newGreeting = await Greeting.create(username, channel);
                return newGreeting;
            }
        }
        catch (error) {
            throw new Error('Error finding greeting: ' + error.message);
        }
    }

    static async allLastSeen(channel) {
        try {
            const query = `
                SELECT username, last_seen FROM greetings
                WHERE channel = $1
                ORDER BY last_seen DESC
            `;
            const values = [channel];
            const result = await db.query(query, values);
            return result.rows;
        }
        catch (error) {
            throw new Error('Error finding greeting: ' + error.message);
        }
    }
}


export default Greeting;
