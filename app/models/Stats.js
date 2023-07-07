class Stats {
    constructor() {

    }

    static async getStats() {
        const query = 'SELECT * FROM stats';
        const { rows } = await db.query(query);
        const stats = rows.map(
            (row) => new Stats({
                mapUserCount: row.map_user_count,
                chatMessagesCount: row.chat_messages_count,
            })
        );
        return stats;
    }
}