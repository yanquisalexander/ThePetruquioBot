import { db } from "../../lib/database.js";

class User {
  constructor(id, twitchId, username, email) {
    this.id = id;
    this.twitchId = twitchId;
    this.username = username;
    this.email = email;
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [id];

    try {
      const result = await db.query(query, values);
      const userData = result.rows[0];
      return new User(userData.id, userData.twitch_id, userData.username, userData.email);
    } catch (error) {
      throw new Error('Failed to find user by ID');
    }
  }

  static async findByTwitchId(twitchId) {
    const query = 'SELECT * FROM users WHERE twitch_id = $1';
    const values = [twitchId];

    try {
      const result = await db.query(query, values);
      const userData = result.rows[0];
      return new User(userData.id, userData.twitch_id, userData.username, userData.email);
    } catch (error) {
        console.log(error);
      throw new Error('Failed to find user by Twitch ID');
    }
  }

  static async findOrCreate(twitchId, username, email, profileData) {
    let user = await User.findByTwitchId(twitchId);

    if (!user) {
      user = await User.create(twitchId, username, email);
    }

    if (profileData) {
      await user.createOrUpdateProfile(profileData);
    }

    return user;
  }

  async getProfile() {
    const query = 'SELECT * FROM profiles WHERE user_id = $1';
    const values = [this.id];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get profile');
    }
  }

  async createOrUpdateProfile(profileData) {
    const query = `
      INSERT INTO profiles (user_id, display_name, broadcaster_type, description, profile_image_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET display_name = $2, broadcaster_type = $3, description = $4, profile_image_url = $5
      RETURNING *
    `;
    const values = [
      this.id,
      profileData.display_name,
      profileData.broadcaster_type,
      profileData.description,
      profileData.profile_image_url
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create or update profile');
    }
  }

  static async create(twitchId, username, email) {
    const query = 'INSERT INTO users (twitch_id, username, email) VALUES ($1, $2, $3) RETURNING *';
    const values = [twitchId, username, email];

    try {
      const result = await db.query(query, values);
      const userData = result.rows[0];
      return new User(userData.id, userData.twitch_id, userData.username, userData.email);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create user');
    }
  }
}

export default User;
