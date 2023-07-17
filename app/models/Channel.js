import chalk from "chalk";
import { db } from "../../lib/database.js";
import Cache from "../Cache.js";
import { langList } from "../../modules/translate.js";
import { merge } from "lodash-es";

const ChannelsCache = new Cache();

export const SETTINGS_MODEL = {
  bot_muted: {
    type: 'boolean',
    value: false,
  },
  channel_language: {
    type: 'list',
    value: 'es',
    options: langList

  },
  channel_about: {
    type: 'string',
    value: '',
  },
  shoutout_presentation: {
    type: 'string',
    value: '',
  },
  enable_translation: {
    type: 'boolean',
    value: false,
  },
  enable_conversation: {
    type: 'boolean',
    value: false,
    experimental: true,
  },
  conversation_prompt: {
    type: 'string',
    value: '',
    experimental: true,
  },
  enable_detoxify: {
    type: 'boolean',
    value: false,
    experimental: true,
  },
  enable_greetings: {
    type: 'boolean',
    value: false,
  },
  enable_community_map: {
    type: 'boolean',
    value: true,
  },
  enable_auto_shoutout: {
    type: 'boolean',
    value: true,
  },
  enable_live_notification: {
    type: 'boolean',
    value: false
  },
  live_notification_message: {
    type: 'string',
    value: '¡#channel está en vivo! ¡Vamos a apoyarlo! - #title'
  },
  enable_first_ranking: {
    type: 'boolean',
    value: false,
  },
  first_ranking_twitch_reward: {
    type: 'channel_point',
    value: '',
  },
  enable_experimental_features: {
    type: 'boolean',
    value: false
  },
}



class Channel {
  constructor({ id, name, twitch_id, settings }) {
    this.id = id;
    this.name = name.toLowerCase(); // Convertir el nombre a minúsculas
    this.twitch_id = twitch_id;
    this.settings = settings;
  }

  // Método estático para obtener todos los canales desde la base de datos
  static async getAllChannels() {
    const query = 'SELECT * FROM channels';
    const { rows } = await db.query(query);
    const channels = rows.map(
      (row) => new Channel({
        id: row.id,
        name: row.name,
        twitch_id: row.twitch_id,
        settings: row.settings,
      })
    );
    return channels;
  }

  // Método para obtener un array de canales a los que se debe unir automáticamente

  static async getAutoJoinChannels() {
    const query = 'SELECT name FROM channels WHERE auto_connect = true ORDER BY name ASC';
    const { rows } = await db.query(query);
    const channels = rows.map((row) => row.name);
    return channels;
  }



  // Método estático para obtener un canal por su nombre desde la base de datos
  static async getChannelByName(name) {
    const cachedChannel = ChannelsCache.get(`channel-${name}`);
    if (cachedChannel) {
      return cachedChannel;
    }

    const query = 'SELECT * FROM channels WHERE LOWER(name) = $1'; // Buscar por el nombre en minúsculas
    const values = [name.toLowerCase()]; // Convertir el nombre a minúsculas

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return null;
    }

    const channelData = rows[0];
    const settings = merge({}, SETTINGS_MODEL, channelData.settings);

    Object.keys(settings).forEach((key) => {
      if (!(key in SETTINGS_MODEL)) {
        console.log(chalk.yellow(`WARNING: The setting "${key}" is not defined in the model`));
        delete settings[key];
      }
    });

    const channel = new Channel({
      id: channelData.id,
      name: channelData.name,
      twitch_id: channelData.twitch_id,
      settings: settings,
    });

    ChannelsCache.set(`channel-${name}`, channel);

    return channel;
  }



  // Método para guardar el canal en la base de datos
  async save() {
    const query = 'INSERT INTO channels (name, twitch_id, settings) VALUES ($1, $2, $3) RETURNING id';
    const values = [this.name.toLowerCase(), this.twitch_id, this.settings]; // Convertir el nombre a minúsculas
    const { rows } = await db.query(query, values);
    this.id = rows[0].id;
  }

  async updateSettings() {
    // Iterar sobre cada ajuste modificado y eliminar las propiedades que no son necesarias
    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key) && typeof this.settings[key] === 'object' && this.settings[key].hasOwnProperty('value')) {
        for (const prop in this.settings[key]) {
          if (prop !== 'value') {
            delete this.settings[key][prop];
          }
        }
      }
    }
    const query = 'UPDATE channels SET settings = $1 WHERE id = $2';
    const values = [this.settings, this.id];
    ChannelsCache.remove(`channel-${this.name}`)
    await db.query(query, values);
  }

  // Método para actualizar los datos del canal en la base de datos
  async update() {
    const query = 'UPDATE channels SET name = $1, twitch_id = $2, settings = $3 WHERE id = $4';
    const values = [this.name.toLowerCase(), this.twitch_id, this.settings, this.id]; // Convertir el nombre a minúsculas
    await db.query(query, values);
  }

  // Método para eliminar el canal de la base de datos
  async delete() {
    const query = 'DELETE FROM channels WHERE name = $1';
    const values = [this.name];
    await db.query(query, values);
  }


  static async findByTwitchId(twitchId) {
    const query = 'SELECT name FROM channels WHERE twitch_id = $1';
    const values = [twitchId];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return null;
    }
    const channelData = rows[0];
    const channel = await Channel.getChannelByName(channelData.name);
    return channel;
  }


  static async deleteChannelByName(channelName) {
    try {

      const query = 'DELETE FROM channels WHERE name = $1';
      const values = [channelName];
      await db.query(query, values);

      console.log(`Canal ${channelName} eliminado de la base de datos`);
    } catch (error) {
      console.log(`Error al eliminar el canal ${channelName} de la base de datos: ${error}`);
      throw error.message;
    }
  }


  static async checkSharedBans(username) {
    const query = `
          SELECT COUNT(*) AS ban_count
          FROM bans b
          INNER JOIN channels c ON c.id = b.channel_id
          INNER JOIN teams t ON t.team_id = c.team_id
          WHERE t.team_id = $1
          AND b.banned_user = $2
        `;
    const values = [this.team_id, username];
    const { rows } = await db.query(query, values);
    const banCount = parseInt(rows[0].ban_count);
    return banCount >= 3; // Verificar si se ha alcanzado el límite de bans compartidos para el usuario
  }

  static async addChannel({ name, twitch_id, settings, team_id, auto_connect }) {
    // Verificar si el canal está baneado en la tabla bot_bans
    const banQuery = 'SELECT channel_id FROM bot_bans WHERE channel_id = $1';
    const banValues = [twitch_id];
    const banResult = await db.query(banQuery, banValues);
    if (banResult.rows.length > 0) {
      throw new Error('Bot has been banned from this channel');
    }

    const query = `
      INSERT INTO channels (name, twitch_id, settings, team_id, auto_connect)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [name.toLowerCase(), twitch_id, settings, team_id, auto_connect];
    const { rows } = await db.query(query, values);
    const newChannelId = rows[0].id;
    return newChannelId;
  }

  static async addAuditory(twitchId, action, data) {
    try {
      const query = 'INSERT INTO channels_audits (twitch_id, action, data) VALUES ($1, $2, $3)';
      const values = [twitchId, action, JSON.stringify(data)];
      await db.query(query, values);

      console.log('Registro de auditoría agregado correctamente.');
    } catch (error) {
      console.error('Error al agregar el registro de auditoría:', error);
      throw error;
    }
  }

  async getAuditories() {
    try {
      const query = 'SELECT * FROM channels_audits WHERE twitch_id = $1 ORDER BY timestamp DESC';
      const values = [this.twitch_id];
      const { rows } = await db.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error al obtener el registro de auditoría:', error);
      throw error;
    }
  }

  static async getRankingEnabledChannels() {
    try {
      // query, con value anidado
      const query = "SELECT * FROM channels WHERE settings->'enable_first_ranking'->>'value' = 'true'";
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener los canales con ranking habilitado:', error);
      throw error;
    }
  }

  static async addToRanking(username, twitchId) {
    try {
      const query = 'INSERT INTO users_ranking (username, twitch_id) VALUES ($1, $2)';
      await db.query(query, [username, twitchId]);
    } catch (error) {
      console.error('Error adding user to ranking:', error);
      throw error;
    }
  }

  async getRanking() {
    try {
      const query = 'SELECT * FROM users_ranking WHERE twitch_id = $1';
      const values = [this.twitch_id];
      const { rows } = await db.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error al obtener el ranking:', error);
      throw error;
    }
  }

}

export default Channel;
