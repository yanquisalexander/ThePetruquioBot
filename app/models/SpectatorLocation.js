import { db } from "../../lib/database.js";
import NodeGeocoder from "node-geocoder";

// Configura el proveedor de geocodificación
const geocoder = NodeGeocoder({
    provider: "openstreetmap",
});

class SpectatorLocation {
    constructor(username, location) {
        this.username = username;
        this.location = location;
        this.latitude = null;
        this.longitude = null;
    }

    async getGeocode() {
        try {
            const response = await geocoder.geocode(this.location);
            if (response && response.length > 0) {
                this.location = response[0].formattedAddress;
                this.latitude = response[0].latitude;
                this.longitude = response[0].longitude;
            }
        } catch (error) {
            console.error('Error al obtener las coordenadas geográficas:', error);
        }
    }

    async save() {
        if (!this.latitude || !this.longitude) {
            await this.getGeocode();
        }

        const insertQuery = {
            text: 'INSERT INTO spectator_locations (username, location, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude RETURNING *',
            values: [this.username, this.location, this.latitude, this.longitude],
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
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener la ubicación del espectador:', error);
            throw error;
        }
    }
}

export default SpectatorLocation;
