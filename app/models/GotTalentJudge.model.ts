import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import User from "./User.model";


class GotTalentJudge {
    public user: User;
    public channel: Channel;
    public judge_name: string | null;
    public position: number | null;

    constructor(user: User, channel: Channel, judge_name: string | null = null, position: number | null = null) {
        this.user = user;
        this.channel = channel;
        this.judge_name = judge_name;
        this.position = position;
    }



    static async addJudge(channel: Channel, user: User): Promise<GotTalentJudge> {
        try {
            const query = `INSERT INTO got_talent_judges (channel_id, judge_id, judge_name) VALUES ($1, $2, $3) RETURNING *`;
            const values = [channel.twitchId, user.twitchId, user.username];

            await Database.query(query, values);

            return new GotTalentJudge(user, channel);

        } catch (error) {
            console.log(error);
            throw new Error((error as Error).message);
        }
    }

    static async removeJudge(channel: Channel, user: User): Promise<void> {
        try {
            const query = `DELETE FROM got_talent_judges WHERE channel_id = $1 AND judge_id = $2`;
            const values = [channel.twitchId, user.twitchId];

            await Database.query(query, values);

        } catch (error) {
            console.log(error);
            throw new Error((error as Error).message);
        }
    }

    static async getJudges(channel: Channel): Promise<any[]> {
        try {
            const query = `
            SELECT users.username, users.display_name, users.avatar, users.twitch_id, judges.judge_name, judges.position
            FROM got_talent_judges AS judges
            JOIN users ON judges.judge_id = users.twitch_id
            WHERE judges.channel_id = $1 ORDER BY judges.position ASC
          `;

            const result = await Database.query(query, [channel.twitchId]);

            return result.rows;
        } catch (error) {
            console.error('Error fetching judges:', (error as Error).message);
            throw new Error('Error fetching judges.');
        }
    }

    static async isJudge(channel: Channel, user: User): Promise<boolean> {
        try {
            const query = `SELECT * FROM got_talent_judges WHERE channel_id = $1 AND judge_id = $2`;
            const values = [channel.twitchId, user.twitchId];

            const result = await Database.query(query, values);

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking if user is judge:', (error as Error).message);
            throw new Error('Error checking if user is judge.');
        }
    }

    static async updateName(channel: Channel, user: User, name: string): Promise<void> {
        try {
            const query = `UPDATE got_talent_judges SET judge_name = $3 WHERE channel_id = $1 AND judge_id = $2`;
            const values = [channel.twitchId, user.twitchId, name];

            await Database.query(query, values);
        } catch (error) {
            console.error('Error updating judge name:', (error as Error).message);
            throw new Error('Error updating judge name.');
        }
    }

    static async updatePosition(channel: Channel, user: User, position: number): Promise<void> {
        try {
            const query = `
            UPDATE got_talent_judges
            SET position = $3
            WHERE channel_id = $1 AND judge_id = $2
            `;
            const values = [channel.twitchId, user.twitchId, position];

            await Database.query(query, values);
        } catch (error) {
            console.error('Error updating judge position:', (error as Error).message);
            throw new Error('Error updating judge position.');
        }
    }
}

export default GotTalentJudge;