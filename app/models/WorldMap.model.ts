import Database from "../../lib/DatabaseManager";

class WorldMap {
    id?: number;
    userId: number;
    channelId: number;
    masked: boolean;
    showOnMap: boolean;
    pinEmote?: string | null;
    pinMessage?: string | null;

    constructor(data: {
        id?: number;
        userId: number;
        channelId: number;
        masked: boolean;
        showOnMap?: boolean;
        pinEmote?: string | null;
        pinMessage?: string | null;
    }) {
        this.id = data.id;
        this.userId = data.userId;
        this.channelId = data.channelId;
        this.masked = data.masked;
        this.showOnMap = data.showOnMap || false;
        this.pinEmote = data.pinEmote;
        this.pinMessage = data.pinMessage;
    }

    async save(): Promise<WorldMap> {
        const query = `
            INSERT INTO world_maps (user_id, channel_id, masked, show_on_map, pin_emote, pin_message)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, channel_id) DO UPDATE SET masked = $3, show_on_map = $4, pin_emote = $5, pin_message = $6
            RETURNING id, user_id, channel_id, masked, show_on_map, pin_emote, pin_message
        `;

        try {
            const result = await Database.query(query, [this.userId, this.channelId, this.masked, this.showOnMap, this.pinEmote, this.pinMessage]);
            const data = result.rows[0];
            return new WorldMap(data);
        } catch (error) {
            console.error("Error creating world map user:", error);
            throw new Error("Failed to create world map user");
        }
    }

    static async find(userId: number, channelId: number): Promise<WorldMap | null> {
        const query = `
            SELECT user_id, channel_id, masked, show_on_map, pin_emote, pin_message
            FROM world_maps
            WHERE user_id = $1 AND channel_id = $2
        `;

        try {
            const result = await Database.query(query, [userId, channelId]);
            const data = result.rows[0];
            return data ? new WorldMap({
                userId: data.user_id,
                channelId: data.channel_id,
                masked: data.masked,
                showOnMap: data.show_on_map,
                pinEmote: data.pin_emote,
                pinMessage: data.pin_message
            }) : null;
        } catch (error) {
            console.error("Error finding world map user by userId:", error);
            throw new Error("Failed to find world map user");
        }
    }

    /* We need to return an Any[] because we are joining 3 tables */

    static async getChannelWorldMap(channelId: number): Promise<any[]> {
        /* Seleccionar latitude, longitude desde spectator_locations, buscar display_name (o username si está vacio) desde users, y por supuesto devolver los datos de world_maps */
        const query = `
            SELECT
        COALESCE(w.user_id, null) AS user_id,
        COALESCE(w.masked, null) AS masked,
        CASE
            WHEN w.show_on_map = true THEN w.show_on_map
            ELSE null
        END AS show_on_map,
        COALESCE(w.pin_emote, null) AS pin_emote,
        COALESCE(w.pin_message, null) AS pin_message,
        COALESCE(sl.latitude, null) AS latitude,
        COALESCE(sl.longitude, null) AS longitude,
        COALESCE(g.last_seen, null) AS last_seen,
        CASE 
            WHEN w.masked = false THEN COALESCE(u.avatar, null)
            ELSE 'https://assets.help.twitch.tv/article/img/Twitch-Emote-Icons/ghost.png'
        END AS user_avatar,
        CASE
            WHEN w.masked = false THEN COALESCE(u.display_name, null)
            ELSE 'Twitch User'
        END AS user_display_name,
        CASE
            WHEN w.masked = false THEN COALESCE(u.username, null)
            ELSE 'twitchuser'
        END AS user_username
    FROM
        world_maps w
    LEFT JOIN
        spectator_locations sl ON w.user_id = sl.user_id
    LEFT JOIN
        users u ON w.user_id = u.twitch_id
    LEFT JOIN
        greetings g ON w.user_id = g.user_id AND g.channel = w.channel_id
    WHERE
        w.channel_id = $1 AND w.show_on_map = true;


        
            `;



        try {
            const result = await Database.query(query, [channelId]);
            const data = result.rows;
            return data
        } catch (error) {
            console.error("Error getting world map channel:", error);
            throw new Error("Failed to get world map channel");
        }
    }

}

export default WorldMap;
