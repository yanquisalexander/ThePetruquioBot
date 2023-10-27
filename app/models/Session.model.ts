import Database from "../../lib/DatabaseManager";

class Session {
    userId: number;
    sessionId: number;
    impersonatedUserId: number | null;
    createdAt: Date;

    constructor(sessionData: {
        user_id: number;
        id: number;
        impersonated_user_id: number | null;
        created_at: Date;
    }) {
        this.userId = sessionData.user_id;
        this.sessionId = sessionData.id;
        this.impersonatedUserId = sessionData.impersonated_user_id;
        this.createdAt = sessionData.created_at;
    }

    static async create(userId: number, deviceInfo: string, locationInfo: string, impersonatedUserId: number | null = null): Promise<Session> {
        const query = `
            INSERT INTO sessions (user_id, impersonated_user_id, device_info, location_info)
            VALUES ($1, $2, $3, $4)
            RETURNING id, user_id, impersonated_user_id, device_info, location_info, created_at
        `;

        try {
            const result = await Database.query(query, [userId, impersonatedUserId, deviceInfo, locationInfo]);
            const sessionData = result.rows[0];
            return new Session(sessionData);
        } catch (error) {
            console.error("Error creating session:", error);
            throw new Error("Failed to create session");
        }
    }

    static async findBySessionId(sessionId: number): Promise<Session | null> {
        const query = `
            SELECT * FROM sessions
            WHERE id = $1
        `;

        try {
            const result = await Database.query(query, [sessionId]);
            const sessionData = result.rows[0];
            return sessionData ? new Session(sessionData) : null;
        } catch (error) {
            console.error("Error finding session by sessionId:", error);
            throw new Error("Failed to find session");
        }
    }

    async setImpersonate(impersonatedUserId: number): Promise<Session> {
        const query = `
            UPDATE sessions
            SET impersonated_user_id = $1
            WHERE id = $2
            RETURNING id, user_id, impersonated_user_id, created_at
        `;

        try {
            const result = await Database.query(query, [impersonatedUserId, this.sessionId]);
            const sessionData = result.rows[0];
            this.impersonatedUserId = sessionData.impersonated_user_id;
            return this;
        } catch (error) {
            console.error("Error setting impersonate:", error);
            throw new Error("Failed to set impersonate");
        }
    }

    async revokeCurrent(): Promise<void> {
        const query = `
            DELETE FROM sessions
            WHERE id = $1
        `;

        try {
            await Database.query(query, [this.sessionId]);
        } catch (error) {
            console.error("Error revoking session:", error);
            throw new Error("Failed to revoke session");
        }
    }

    static async revokeAll(userId: number): Promise<void> {
        const query = `
            DELETE FROM sessions
            WHERE user_id = $1
        `;

        try {
            await Database.query(query, [userId]);
        } catch (error) {
            console.error("Error revoking all sessions:", error);
            throw new Error("Failed to revoke all sessions");
        }
    }
}

export default Session;
