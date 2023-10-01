import { db } from "../../lib/database.js";
import NodeGeocoder from "node-geocoder";
import { userLocationQueue } from "../../memory_variables.js";

// Configura el proveedor de geocodificación
const geocoder = NodeGeocoder({
    provider: "openstreetmap",
});

class SpectatorLocation {
    constructor(username, location, latitude = null, longitude = null, countryCode = null) {
        this.username = username;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.countryCode = countryCode;
    }

    async getGeocode() {
        try {
            const response = await geocoder.geocode(this.location);
            if (response && response.length > 0) {
                this.location = response[0].formattedAddress; // Actualiza la ubicación con la dirección formateada
                this.latitude = response[0].latitude;
                this.longitude = response[0].longitude;
                this.countryCode = response[0].countryCode;
            }

        } catch (error) {
            console.error('Error al obtener las coordenadas geográficas:', error);
            throw error;
        }
    }

    async save() {
        if (!this.latitude || !this.longitude || !this.countryCode) {
            await this.getGeocode();
        }

        const insertQuery = {
            text: 'INSERT INTO spectator_locations (username, location, latitude, longitude, country_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO UPDATE SET location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, country_code = EXCLUDED.country_code RETURNING *',
            values: [this.username, this.location, this.latitude, this.longitude, this.countryCode], // Asegúrate de incluir this.countryCode
        };

        try {
            const result = await db.query(insertQuery);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear o actualizar la ubicación del espectador:', error);
            throw error;
        }
    }

    async update(newLocation) {
        const updateQuery = {
            text: 'UPDATE spectator_locations SET location = $1 WHERE username = $2',
            values: [newLocation, this.username],
        };

        try {
            await db.query(updateQuery);
            console.log('Ubicación del espectador actualizada con éxito.');
        } catch (error) {
            console.error('Error al actualizar la ubicación del espectador:', error);
            throw error;
        }
    }

    static async rename(oldUsername, newUsername) {
        try {
            // Check if the new username already exists in the database
            const checkUsernameQuery = {
                text: 'SELECT COUNT(*) FROM spectator_locations WHERE username = $1',
                values: [newUsername],
            };
            const usernameExists = await db.query(checkUsernameQuery);
    
            if (usernameExists.rows[0].count > 0) {
                // The new username already exists, so we need to delete the old one
                const deleteOldUsernameQuery = {
                    text: 'DELETE FROM spectator_locations WHERE username = $1',
                    values: [oldUsername],
                };
                await db.query(deleteOldUsernameQuery);
            } else {
                // The new username doesn't exist, so we can simply update the old username to the new one
                const updateUsernameQuery = {
                    text: 'UPDATE spectator_locations SET username = $1 WHERE username = $2',
                    values: [newUsername, oldUsername],
                };
                await db.query(updateUsernameQuery);
            }
    
            console.log('Username del espectador actualizado con éxito.');
        } catch (error) {
            console.error('Error al actualizar el username del espectador:', error);
            throw error;
        }
    }
    

    async delete() {
        const deleteQuery = {
            text: 'DELETE FROM spectator_locations WHERE username = $1',
            values: [this.username],
        };

        const updateQuery = {
            text: 'UPDATE WorldMap SET show_on_map = FALSE WHERE username = $1',
            values: [this.username],
        };

        try {
            await db.query(deleteQuery);
            await db.query(updateQuery);
            console.log('Ubicación del espectador eliminada con éxito.');
        } catch (error) {
            console.error('Error al eliminar la ubicación del espectador:', error);
            throw error;
        }
    }

    static async find(username) {
        const query = {
            text: 'SELECT * FROM spectator_locations WHERE username = $1',
            values: [username],
        };

        try {
            const result = await db.query(query);
            if (result.rows.length === 0) return null; // Si no se encuentra la ubicación del espectador, devuelve null
            return new SpectatorLocation(result.rows[0].username, result.rows[0].location, result.rows[0].latitude, result.rows[0].longitude, result.rows[0].country_code);
        } catch (error) {
            console.error('Error al obtener la ubicación del espectador:', error);
            throw error;
        }
    }
}

export default SpectatorLocation;
