import { db } from "../../lib/database.js";

class Session {
    constructor(sessionData) {
        this.userId = sessionData.user_id;
        this.sessionId = sessionData.id;
        this.impersonatedUserId = sessionData.impersonated_user_id;
        this.createdAt = sessionData.created_at;
    }


    static async create(userId, deviceInfo, locationInfo, impersonatedUserId = null) {
        const query = `
          INSERT INTO sessions (user_id, impersonated_user_id, device_info, location_info)
          VALUES ($1, $2, $3, $4)
          RETURNING id, user_id, impersonated_user_id, device_info, location_info, created_at
        `;
    
        try {
          const result = await db.query(query, [userId, impersonatedUserId, deviceInfo, locationInfo]);
          const sessionData = result.rows[0];
          return new Session(sessionData);
        } catch (error) {
          console.error("Error creating session:", error);
          throw new Error("Failed to create session");
        }
      }
    
    
    
    
    
    
    
    

    static async findBySessionId(sessionId) {
        const query = `
      SELECT * FROM sessions
      WHERE id = $1
    `;

        try {
            const result = await db.query(query, [sessionId]);
            const sessionData = result.rows[0];
            return sessionData ? new Session(sessionData) : null;
        } catch (error) {
            console.error("Error finding session by sessionId:", error);
            throw new Error("Failed to find session");
        }
    }

    async setImpersonate(impersonatedUserId) {
        const query = `
          UPDATE sessions
          SET impersonated_user_id = $1
          WHERE id = $2
          RETURNING id, user_id, impersonated_user_id, created_at
        `;
      
        try {
          const result = await db.query(query, [impersonatedUserId, this.sessionId]);
          const sessionData = result.rows[0];
          this.impersonatedUserId = sessionData.impersonated_user_id;
          return this;
        } catch (error) {
          console.error("Error setting impersonate:", error);
          throw new Error("Failed to set impersonate");
        }
      }
      

    async revokeCurrent() {
        const query = `
      DELETE FROM sessions
      WHERE id = $1
    `;

        try {
            await db.query(query, [this.sessionId]);
        } catch (error) {
            console.error("Error revoking session:", error);
            throw new Error("Failed to revoke session");
        }
    }

    static async revokeAll(userId) {
        const query = `
      DELETE FROM sessions
      WHERE user_id = $1
    `;

        try {
            await db.query(query, [userId]);
        }
        catch (error) {
            console.error("Error revoking all sessions:", error);
            throw new Error("Failed to revoke all sessions");
        }
    }


}

export default Session;
