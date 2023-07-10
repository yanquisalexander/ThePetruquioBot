import { db } from "../../lib/database.js";

class BotModel {

  static async addBan(channel) {
    const timestamp = new Date().toISOString(); // Obtener la marca de tiempo actual
    const query = 'INSERT INTO bot_bans (channel_id, timestamp) VALUES ($1, $2)';
    const values = [channel, timestamp];
    await db.query(query, values);

    // Actualizar el valor de auto_connect a false en la tabla channels
    const updateQuery = 'UPDATE channels SET auto_connect = false WHERE channel_id = $1';
    const updateValues = [channel];
    await db.query(updateQuery, updateValues);
  }


}

export default BotModel;