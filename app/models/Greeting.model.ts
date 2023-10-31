import chalk from "chalk";
import Cache from "../Cache";
import Channel from "./Channel.model.js";
import Database from "../../lib/DatabaseManager";
import User from "./User.model";

export const GreetingsCache = new Cache();

interface GreetingData {
    twitchId: number;
    channel: Channel;
    lastSeen: Date;
    shoutoutedAt: Date;
    enabled: boolean;
}


class Greeting {
    twitchId: number;
    channel: Channel;
    lastSeen: Date;
    shoutoutedAt: Date;
    enabled: boolean;
    constructor({ twitchId, channel, lastSeen, shoutoutedAt, enabled }: GreetingData) {
        this.twitchId = twitchId;
        this.channel = channel;
        this.lastSeen = lastSeen;
        this.shoutoutedAt = shoutoutedAt;
        this.enabled = enabled;
    }

    static async create(user: User, channel: Channel, lastSeen = new Date(), shoutoutedAt: Date | null = null, enabled = true): Promise<Greeting> {
        try {
            const query = `
                INSERT INTO greetings (user_id, channel, last_seen, shoutouted_at, enabled)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, channel) DO UPDATE SET last_seen = $3, shoutouted_at = $4, enabled = $5
                RETURNING *
            `;
            const values = [user.twitchId, channel.twitchId, lastSeen, shoutoutedAt, enabled];
            const result = await Database.query(query, values)
            const greetingData = result.rows[0];
            return new Greeting(greetingData);
        } catch (error) {
            throw new Error('Error creating greeting: ' + (error as Error).message);
        }
    }

    static async updateShoutoutTimestamp(user: User, channel: Channel): Promise<Greeting> {
        try {
            const query = `
                UPDATE greetings
                SET shoutouted_at = $1
                WHERE user_id = $2 AND channel = $
                RETURNING *
            `;
            const shoutoutedAt = new Date(); // Obtener la fecha y hora actual
            const values = [shoutoutedAt, user.twitchId, channel.twitchId];
            const result = await Database.query(query, values)
            const greetingData = result.rows[0];
            return new Greeting(greetingData);
        } catch (error) {
            throw new Error('Error updating greeting: ' + (error as Error).message);
        }
    }

    static async updateTimestamp(user: User, channel: Channel): Promise<Greeting> {
        try {
            const query = `
                UPDATE greetings
                SET last_seen = $1
                WHERE user_id = $2 AND channel = $3
                RETURNING *
            `;
            const lastSeen = new Date();
            const values = [lastSeen, user.twitchId, channel.twitchId];
            const result = await Database.query(query, values)
            const updatedGreeting = result.rows[0];
            return new Greeting(updatedGreeting);
        } catch (error) {
            throw new Error('Error updating greeting: ' + (error as Error).message);
        }
    }

    static async findByChannel(channel: Channel, user: User): Promise<Greeting | null> {
        try {
            const query = `
                SELECT * FROM greetings
                WHERE user_id = $1 AND channel = $2
            `;


            const values = [user.twitchId, channel.twitchId];
            const result = await Database.query(query, values);
            if (result.rows.length > 0) {
                return new Greeting({
                    twitchId: user.twitchId,
                    channel,
                    lastSeen: result.rows[0].last_seen,
                    shoutoutedAt: result.rows[0].shoutouted_at,
                    enabled: result.rows[0].enabled
                });
            } else {
                this.create(user, channel, new Date(), null, true);
                return null;
            }
        } catch (error) {
            throw new Error('Error finding greeting: ' + (error as Error).message);
        }
    }

    static async allLastSeen(channel: string): Promise<{ user_id: number, lastSeen: Date }[]> {
        try {
            const query = `
                SELECT user_id, last_seen FROM greetings
                WHERE channel = $1
                ORDER BY last_seen DESC
            `;
            const values = [channel];
            const result = await Database.query(query, values);
            if (result) {
                return result.rows;
            } else {
                return [];
            }
        } catch (error) {
            throw new Error('Error finding greeting: ' + (error as Error).message);
        }
    }

    static async getByUser(user: User): Promise<any[]> {
        try {
            const query = `
                SELECT * FROM greetings
                WHERE user_id = $1
            `;
            const values = [user.twitchId];
            const result = await Database.query(query, values);
            if (result) {
                return result.rows;
            } else {
                return [];
            }
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async save(): Promise<void> {
        const query = `
            INSERT INTO greetings (user_id, channel, last_seen, shoutouted_at, enabled)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, channel) DO UPDATE SET last_seen = $3, shoutouted_at = $4, enabled = $5
        `;
        const values = [this.twitchId, this.channel.twitchId, this.lastSeen, this.shoutoutedAt, this.enabled];
        await Database.query(query, values);
    }
}

export default Greeting;
