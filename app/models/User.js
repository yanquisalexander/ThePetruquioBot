import { Bot } from "../../bot.js";
import { db } from "../../lib/database.js";
import Channel from "./Channel.js";

class User {
  constructor(id, twitchId, username, email, admin = false) {
    this.id = id;
    this.twitchId = twitchId;
    this.username = username;
    this.email = email;
    this.admin = admin;
  }

  static async findAll() {
    // Get User, Profile and Channel and merge them
    const query = `
      SELECT users.id, users.twitch_id, users.username, users.email, users.admin, profiles.display_name, profiles.broadcaster_type, profiles.description, profiles.profile_image_url, channels.name, channels.team_id, channels.twitch_id, channels.settings, channels.auto_connect
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      LEFT JOIN channels ON users.twitch_id = channels.twitch_id
      ORDER BY users.username ASC
    `;


    try {
      const result = await db.query(query);
      const users = result.rows.map(row => {
        const user = new User(row.id, row.twitch_id, row.username, row.email, row.admin);
        user.profile = {
          display_name: row.display_name,
          broadcaster_type: row.broadcaster_type,
          description: row.description,
          profile_image_url: row.profile_image_url
        };
        user.channel = {
          name: row.name,
          team_id: row.team_id,
          twitch_id: row.twitch_id,
          settings: row.settings,
          auto_connect: row.auto_connect
        };
        return user;
      });
      return users;
    } catch (error) {
      throw new Error('Failed to find all users');
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];

    try {
      const result = await db.query(query, values);

      const userData = result.rows[0];
      if (!userData) {
        return null;
      }
      return new User(userData.id, userData.twitch_id, userData.username, userData.email);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to find user by username');
    }
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
      if (!userData) {
        return null;
      }
      return new User(userData.id, userData.twitch_id, userData.username, userData.email, userData.admin);
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
      let channel = await Channel.findByTwitchId(twitchId);
      if (!channel) {
        await Channel.addChannel({
          name: username,
          team_id: null,
          twitch_id: twitchId,
          settings: {},
          auto_connect: false
        })
      }
      return new User(userData.id, userData.twitch_id, userData.username, userData.email);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create user');
    }
  }
  async delete() {
    const query = `DELETE FROM users WHERE id = $1`;

    const values = [this.id];

    try {
      await db.query(query, values);
    }
    catch (error) {
      console.log(error);
      throw new Error('Failed to delete user');
    }

  }

  // Método para conectar una cuenta externa con la cuenta de usuario
  async connectExternalProvider(providerName, providerUserId, access_token, refresh_token, userInfo) {
    try {
      // Verificar si el proveedor ya existe en la tabla "providers"
      const provider = await db.query('SELECT * FROM providers WHERE provider_name = $1', [providerName]);

      if (provider.rows.length === 0) {
        // Si el proveedor no existe, agregarlo a la tabla "providers"
        await db.query('INSERT INTO providers (provider_name) VALUES ($1)', [providerName]);
      }

      // Verificar si ya existe una conexión para este usuario con el proveedor dado
      const connection = await db.query(
        'SELECT * FROM connected_accounts WHERE user_id = $1 AND provider_id = (SELECT provider_id FROM providers WHERE provider_name = $2)',
        [this.id, providerName]
      );

      if (connection.rows.length === 0) {
        // Si no existe una conexión, agregarla a la tabla "connected_accounts"
        await db.query(
          'INSERT INTO connected_accounts (user_id, provider_id, provider_user_id, access_token, refresh_token, userinfo) VALUES ($1, (SELECT provider_id FROM providers WHERE provider_name = $2), $3, $4, $5, $6)',
          [this.id, providerName, providerUserId, access_token, refresh_token, userInfo]
        );
      }
      else {
        // Si ya existe una conexión, actualizarla
        await db.query(
          'UPDATE connected_accounts SET access_token = $1, refresh_token = $2, userinfo = $3 WHERE user_id = $4 AND provider_id = (SELECT provider_id FROM providers WHERE provider_name = $5)',
          [access_token, refresh_token, userInfo, this.id, providerName]
        );
      }

      // Retorna true para indicar que se ha conectado exitosamente
      return true;
    } catch (error) {
      console.error('Error connecting external provider:', error);
      return false;
    }
  }

  async getConnectedAccounts() {
    try {
      const result = await db.query(
        'SELECT * FROM connected_accounts WHERE user_id = $1',
        [this.id]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting connected accounts:', error);
      return [];
    }
  }

  async getConnectedAccountInfo(providerName) {
    try {
      const result = await db.query(
        'SELECT * FROM connected_accounts WHERE user_id = $1 AND provider_id = (SELECT provider_id FROM providers WHERE provider_name = $2)',
        [this.id, providerName]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        // If no connected account found, you can handle it accordingly.
        return null;
      }
    } catch (error) {
      console.error('Error getting connected account info:', error);
      throw error; // Re-throw the error to be handled by the caller of this method.
    }
  }


  async disconnectExternalProvider(providerName) {
    try {
      await db.query(
        'DELETE FROM connected_accounts WHERE user_id = $1 AND provider_id = (SELECT provider_id FROM providers WHERE provider_name = $2)',
        [this.id, providerName]
      );
      return true;
    } catch (error) {
      console.error('Error disconnecting external provider:', error);
      return false;
    }
  }

}

export default User;
