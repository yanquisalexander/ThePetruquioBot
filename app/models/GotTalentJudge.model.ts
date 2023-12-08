import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import User from "./User.model";


class GotTalentJudge {
    public user: User;
    public channel: Channel;

    constructor(user: User, channel: Channel) {
        this.user = user;
        this.channel = channel;
    }

    static async addJudge(channel: Channel, user: User): Promise<GotTalentJudge> {
        try {
            const query = `SELECT insert_judge($1, $2)`;
            const values = [channel.twitchId, user.twitchId];

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
            SELECT users.username, users.display_name, users.avatar, users.twitch_id
            FROM got_talent_judges AS judges
            JOIN users ON judges.judge_id = users.twitch_id
            WHERE judges.channel_id = $1;
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
}

export default GotTalentJudge;