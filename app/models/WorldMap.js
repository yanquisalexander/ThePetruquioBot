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
            text: 'INSERT INTO WorldMap (username, channel_name, show_on_map, pin_emote, pin_message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            values: [this.username, this.channelName, this.showOnMap, this.pinEmote, this.pinMessage],
        };

        try {
            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear el registro en el WorldMap:', error);
            throw error;
        }
    }
}

export default WorldMap;