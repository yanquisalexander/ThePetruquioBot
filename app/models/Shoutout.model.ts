import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import User from "./User.model";

class Shoutout {
    id?: number;
    channel: Channel;
    user: User;
    messages: string[];
    enabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(channel: Channel, user: User, messages: string[], enabled: boolean, createdAt?: Date, updatedAt?: Date) {
        this.channel = channel;
        this.user = user;
        this.messages = messages;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async find(channel: Channel, user: User): Promise<Shoutout | null> {
        try {
            const query = 'SELECT * FROM shoutouts WHERE channel_id = $1 AND user_id = $2';
            const values = [channel.twitchId, user.twitchId];
            const result = await Database.query(query, values);

            if (result.rows.length > 0) {
                const shoutoutData = result.rows[0];
                return new Shoutout(
                    channel,
                    user,
                    shoutoutData.messages,
                    shoutoutData.enabled,
                    shoutoutData.created_at,
                    shoutoutData.updated_at
                );
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getChannelShoutouts(channel: Channel): Promise<any[]> {
        try {
            const query = `
                SELECT
                    u.username,
                    u.display_name,
                    u.avatar,
                    u.twitch_id AS user_id,
                    s.messages,
                    s.enabled
                FROM shoutouts AS s
                INNER JOIN users AS u ON s.user_id = u.twitch_id
                WHERE s.channel_id = $1
            `;
            const values = [channel.twitchId];
            const result = await Database.query(query, values);
    
            return result.rows;
        } catch (error) {
            console.error(error);
            return [];
        }
    }
    

    async save(): Promise<void> {
        try {
            const query = `
                INSERT INTO shoutouts (channel_id, user_id, messages, enabled)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (channel_id, user_id) DO UPDATE
                    SET messages = $3,
                        enabled = $4,
                        updated_at = NOW()
            `;
            const values = [this.channel.twitchId, this.user.twitchId, this.messages, this.enabled];
            await Database.query(query, values);
        } catch (error) {
            console.error(error);
        }
    }

    async delete(): Promise<void> {
        try {
            const query = 'DELETE FROM shoutouts WHERE channel_id = $1 AND user_id = $2';
            const values = [this.channel.twitchId, this.user.twitchId];
            await Database.query(query, values);
        } catch (error) {
            console.error(error);
        }
    }

    async enable(): Promise<void> {
        this.enabled = true;
        await this.save();
    }

    async disable(): Promise<void> {
        this.enabled = false;
        await this.save();
    }
}

export default Shoutout;