class Bot {
  
    static async addBan(channel) {
    
      const timestamp = new Date().toISOString(); // Obtener la marca de tiempo actual
      const query = 'INSERT INTO bot_bans (channel_id, timestamp) VALUES ($1, $2)';
      const values = [channel, timestamp];
      await db.query(query, values);
    }
  
    // ...
  }
  