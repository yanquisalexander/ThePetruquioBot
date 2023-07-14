import { db } from "../../lib/database.js";

class UserToken {
    static async findByUserId(userId) {
        const query = 'SELECT * FROM user_tokens WHERE user_id = $1';
        const values = [userId];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new Error('Failed to find user token by user ID');
        }
    }

    static async create(userId, twitchToken, refreshToken) {
        const query = 'INSERT INTO user_tokens (user_id, twitch_token, refresh_token) VALUES ($1, $2, $3) RETURNING *';
        const values = [userId, twitchToken, refreshToken];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new Error('Failed to create user token');
        }
    }

    static async update(userId, twitchToken, refreshToken) {
        const query = 'UPDATE user_tokens SET twitch_token = $2, refresh_token = $3 WHERE user_id = $1 RETURNING *';
        const values = [userId, twitchToken, refreshToken];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new Error('Failed to update user token');
        }
    }

    static async deleteByUserId(userId) {
        const query = 'DELETE FROM user_tokens WHERE user_id = $1';
        const values = [userId];

        try {
            await db.query(query, values);
        } catch (error) {
            console.log(error);
            throw new Error('Failed to delete user token by user ID');
        }
    }
}

export default UserToken;
