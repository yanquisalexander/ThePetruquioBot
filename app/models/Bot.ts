import Database from "../../lib/database.js";
import WorldMap from "./WorldMap.js";

class BotModel {

  static async addBan(channel: string) {
    const timestamp = new Date().toISOString(); // Obtener la marca de tiempo actual
    const query = 'INSERT INTO bot_bans (channel_id, timestamp) VALUES ($1, $2)';
    const values = [channel, timestamp];
    await Database.query(query, values);

    // Actualizar el valor de auto_connect a false en la tabla channels
    const updateQuery = 'UPDATE channels SET auto_connect = false WHERE twitch_id = $1';
    const updateValues = [channel];
    await Database.query(updateQuery, updateValues);
  }

  static async isBanned(channelId: Number) {
    const query = 'SELECT * FROM bot_bans WHERE channel_id = $1';
    const values = [channelId];
    const result = await Database.query(query, values);
    return result.rows[0];
  }

  static async renameUser(id: Number, username: String, channelName: String) {
    // TODO: Anexar el id del usuario a las tablas de la base de datos
  }


}

export default BotModel;