import { db } from "../../lib/database.js";

class UserToken {
  static async findByUserId(userId) {
    const query = 'SELECT token_data FROM user_tokens WHERE user_id = $1';
    const values = [userId];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.log(error);
      throw new Error('Failed to find user token by user ID');
    }
  }

  static async create(userId, tokenData) {
    const query = 'INSERT INTO user_tokens (user_id, token_data) VALUES ($1, $2) RETURNING *';
    const values = [userId, tokenData];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create user token');
    }
  }

  static async update(userId, tokenData) {
    const query = 'UPDATE user_tokens SET token_data = $2 WHERE user_id = $1 RETURNING *';
    const values = [userId, tokenData];

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

  static async getAll() {
    const query = 'SELECT * FROM user_tokens';

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get all user tokens');
    }
  }
}

export default UserToken;
