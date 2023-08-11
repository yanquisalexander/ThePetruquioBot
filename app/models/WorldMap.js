import { db } from "../../lib/database.js";

const R = 6371; // Radio de la Tierra en kilómetros
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en kilómetros
  return distance;
}

class WorldMap {
  constructor(username, channelName, showOnMap = true, pinEmote, pinMessage) {
    this.username = username;
    this.channelName = channelName;
    this.showOnMap = showOnMap;
    this.pinEmote = pinEmote;
    this.pinMessage = pinMessage;
  }



  static async forgive(username, channelName) {
    const query = `DELETE FROM WorldMap WHERE username = $1 AND channel_name = $2`;

    try {
      await db.query(query, [username, channelName]);
    } catch (error) {
      console.error('Error al eliminar al usuario en el WorldMap:', error);
      throw error;
    }
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
      if (result.rows.length === 0) {
        return null;
      }
      const data = result.rows[0];
      return new WorldMap(data.username, data.channel_name, data.show_on_map, data.pin_emote, data.pin_message);
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


  static async getNeighbours(username, channelName, limit = 3) {
    try {
      let map = await this.getChannelMap(channelName);
      let user = map.find((user) => user.username === username);
      if (!user) {
        return [];
      }

      // Ordenar los usuarios por distancia utilizando la función haversineDistance
      map.sort((a, b) => {
        const distanceA = haversineDistance(user.latitude, user.longitude, a.latitude, a.longitude);
        const distanceB = haversineDistance(user.latitude, user.longitude, b.latitude, b.longitude);
        return distanceA - distanceB;
      });

      // Retornar los N vecinos más cercanos (excluyendo al usuario actual)
      const neighbours = map
        .filter((neighbour) => neighbour.username !== username)
        .slice(0, limit);

      return neighbours;
    } catch (error) {
      console.error('Error al obtener los vecinos:', error);
      throw error;
    }
  }

}


export default WorldMap;