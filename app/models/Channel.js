import { db } from "../../lib/database.js";

let SETTINGS_MODEL = {
    language: 'es',
    about: null,
    shoutOutPresentation: null,
    translate: {
        enabled: false,
    },
    conversation: {
        enabled: false,
        prompt: null
    },
    moderation: {
        autoban: false
    },
    greetings: {
        enabled: false,
    },
    autoShoutOut: {
        enabled: true,
    }
}

class Channel {
    constructor({ id, name, twitch_id, settings }) {
        this.id = id;
        this.name = name.toLowerCase(); // Convertir el nombre a minúsculas
        this.twitch_id = twitch_id;
        this.settings = settings;
    }

    // Método estático para obtener todos los canales desde la base de datos
    static async getAllChannels() {
        const query = 'SELECT * FROM channels';
        const { rows } = await db.query(query);
        const channels = rows.map(
            (row) => new Channel({
                id: row.id,
                name: row.name,
                twitch_id: row.twitch_id,
                settings: row.settings,
            })
        );
        return channels;
    }

    // Método estático para obtener un canal por su nombre desde la base de datos
    static async getChannelByName(name) {
        const query = 'SELECT * FROM channels WHERE LOWER(name) = $1'; // Buscar por el nombre en minúsculas
        const values = [name.toLowerCase()]; // Convertir el nombre a minúsculas
        const { rows } = await db.query(query, values);
        if (rows.length === 0) {
            return null;
        }
        const channelData = rows[0];
        const settings = { ...SETTINGS_MODEL, ...channelData.settings };
        return new Channel({
            id: channelData.id,
            name: channelData.name,
            twitch_id: channelData.twitch_id,
            settings: settings,
        });
    }

    // Método para guardar el canal en la base de datos
    async save() {
        const query = 'INSERT INTO channels (name, twitch_id, settings) VALUES ($1, $2, $3) RETURNING id';
        const values = [this.name.toLowerCase(), this.twitch_id, this.settings]; // Convertir el nombre a minúsculas
        const { rows } = await db.query(query, values);
        this.id = rows[0].id;
    }

    // Método para actualizar los datos del canal en la base de datos
    async update() {
        const query = 'UPDATE channels SET name = $1, twitch_id = $2, settings = $3 WHERE id = $4';
        const values = [this.name.toLowerCase(), this.twitch_id, this.settings, this.id]; // Convertir el nombre a minúsculas
        await db.query(query, values);
    }

    // Método para eliminar el canal de la base de datos
    async delete() {
        const query = 'DELETE FROM channels WHERE id = $1';
        const values = [this.id];
        await db.query(query, values);
    }
}

export default Channel;
