import { db } from "../../lib/database.js";

class WorldMap {
  constructor(username, channelName, showOnMap = true, pinEmote, pinMessage) {
    this.username = username;
    this.channelName = channelName;
    this.showOnMap = showOnMap;
    this.pinEmote = pinEmote;
    this.pinMessage = pinMessage;
  }

  async save() {
    const query = {
      text: `
            INSERT INTO WorldMap (username, channel_name, show_on_map, pin_emote, pin_message)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username, channel_name) DO UPDATE
            SET
              show_on_map = COALESCE($3, WorldMap.show_on_map),
              pin_emote = COALESCE($4, WorldMap.pin_emote),
              pin_message = COALESCE($5, WorldMap.pin_message)
            RETURNING *
          `,
      values: [this.username, this.channelName, this.showOnMap, this.pinEmote, this.pinMessage],
    };

    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear o actualizar el registro en el WorldMap:', error);
      throw error;
    }
  }

  static async get(username, channelName) {
    const query = {
      text: `
            SELECT *
            FROM WorldMap
            WHERE username = $1 AND channel_name = $2
          `,
      values: [username, channelName],
    };

    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener el registro del WorldMap:', error);
      throw error;
    }
  }

  static async getChannelMap(channelName) {
    const query = {
      text: `SELECT sl.latitude, sl.longitude, wm.username, wm.pin_message, wm.pin_emote
               FROM worldmap AS wm
               INNER JOIN spectator_locations AS sl ON wm.username = sl.username
               WHERE wm.channel_name = $1 AND wm.show_on_map = true
                     AND sl.latitude IS NOT NULL AND sl.longitude IS NOT NULL`,
      values: [channelName],
    };


    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener el mapa del canal:', error);
      throw error;
    }
  }
}

export default WorldMap;