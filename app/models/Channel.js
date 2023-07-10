import { db } from "../../lib/database.js";
import Cache from "../Cache.js";

const ChannelsCache = new Cache();

export const SETTINGS_MODEL = {
  bot_muted: {
    type: 'boolean',
    value: false,
  },
  language: {
    type: 'string',
    value: 'es',
  },
  about: {
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
  },
  conversation_prompt: {
    type: 'string',
    value: '',
  },
  enable_detoxify: {
    type: 'boolean',
    value: false,
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
};



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
    const query = 'SELECT name FROM channels WHERE auto_connect = true';
    const { rows } = await db.query(query);
    const channels = rows.map((row) => row.name);
    return channels;
  }



  // Método estático para obtener un canal por su nombre desde la base de datos
  static async getChannelByName(name) {
    let cachedChannel = ChannelsCache.get(`channel-${name}`);
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
    const settings = { ...SETTINGS_MODEL, ...channelData.settings };
    let channel = new Channel({
      id: channelData.id,
      name: channelData.name,
      twitch_id: channelData.twitch_id,
      settings: settings,
    })
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
    const query = 'DELETE FROM channels WHERE id = $1';
    const values = [this.id];
    await db.query(query, values);
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



}

export default Channel;
