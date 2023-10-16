import chalk from "chalk";
import { db } from "../../lib/database.js";
import Cache from "../Cache.js"; // Importa tu clase Cache

// Crea una instancia de Cache
const settingsCache = new Cache();

const defaultSettings = [
    { key: 'welcome_message', value: 'Welcome to our website!', type: 'text' },
    { key: 'welcome_message_enabled', value: 'true', type: 'boolean' },
    { key: 'site_name', value: 'My Website', type: 'text' },
    { key: 'private_mode', value: 'false', type: 'boolean' },

    // ... otros ajustes predefinidos ...
];

class GlobalSettings {

    static async createOrUpdate(key, value) {
        try {
            const query = `
            INSERT INTO global_settings (key, value)
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value
            RETURNING *
          `;
            const result = await db.query(query, [key, value]);

            // Actualiza el caché
            settingsCache.set(key, value);

            return result.rows[0];
        } catch (error) {
            throw new Error('Error creating/updating global setting: ' + error.message);
        }
    }

    static async get(key) {
        // Intenta obtener el valor desde el caché
        const cachedValue = settingsCache.get(key);
        if (cachedValue !== null) {
            return cachedValue;
        }

        try {
            const query = `
            SELECT value
            FROM global_settings
            WHERE key = $1
          `;
            const result = await db.query(query, [key]);
            const value = result.rows[0] ? result.rows[0].value : null;

            // Guarda el valor en caché
            if (value !== null) {
                settingsCache.set(key, value);
            }

            return value;
        } catch (error) {
            throw new Error('Error getting global setting: ' + error.message);
        }
    }

    static async delete(key) {
        try {
            const query = `
            DELETE FROM global_settings
            WHERE key = $1
          `;
            await db.query(query, [key]);

            // Remueve el valor del caché
            settingsCache.remove(key);
        } catch (error) {
            throw new Error('Error deleting global setting: ' + error.message);
        }
    }


    static async initializeSettings() {
        try {
            for (const setting of defaultSettings) {
                const existingValue = await this.get(setting.key);

                if (!existingValue) {
                    console.log(chalk.yellow(`WARN: Setting ${setting.key} not found. Initializing with default value.`));
                    await this.createOrUpdate(setting.key, setting.value);
                }
            }
        } catch (error) {
            throw new Error('Error initializing default settings: ' + error.message);
        }
    }

}

export default GlobalSettings;
