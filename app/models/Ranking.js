import { db } from "../../lib/database.js";

class Ranking {
  constructor({ channelName }) {
    this.channelName = channelName;
  }

  async getChannelRanking() {
    try {
      const query = `
        SELECT channel_name, COUNT(*) as count
        FROM ranking
        GROUP BY channel_name
      `;
      const result = await db.query(query);

      const ranking = {};
      result.rows.forEach(row => {
        ranking[row.channel_name] = row.count;
      });

      return ranking;
    } catch (error) {
      console.error('Error al obtener el ranking de canjes:', error);
      throw error;
    }
  }

  async addRedeem(username) {
    try {
      const query = `
        INSERT INTO ranking (channel_name, username, redeemed_at)
        VALUES ($1, $2, NOW())
      `;
      await db.query(query, [this.channelName, username]);
    } catch (error) {
      console.error('Error al agregar el canje:', error);
      throw error;
    }
  }
}

export default Ranking;
