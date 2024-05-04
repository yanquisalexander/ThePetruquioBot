import Database from "../../lib/DatabaseManager";

class SpectatorLocation {
    userId: number;
    latitude: string | undefined;
    longitude: string | undefined;
    location: string | undefined;
    countryCode: string | undefined;

    constructor(
        userId: number,
        latitude: string | undefined,
        longitude: string | undefined,
        location: string | undefined,
        countryCode: string | undefined
    ) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.location = location;
        this.countryCode = countryCode;
    }

    async save(): Promise<SpectatorLocation> {
        const query = `
      INSERT INTO spectator_locations (user_id, latitude, longitude, location, country_code)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location = EXCLUDED.location,
        country_code = EXCLUDED.country_code
      RETURNING *;
    `;

        const values = [
            this.userId,
            this.latitude,
            this.longitude,
            this.location,
            this.countryCode,
        ];

        const result = await Database.query(query, values);

        const spectatorLocationData = result.rows[0];

        return new SpectatorLocation(
            spectatorLocationData.user_id,
            spectatorLocationData.latitude,
            spectatorLocationData.longitude,
            spectatorLocationData.location,
            spectatorLocationData.country_code
        );
    }

    static async findByUserId(userId: number): Promise<SpectatorLocation | null> {
        try {
            const query = `
            SELECT * FROM spectator_locations
            WHERE user_id = $1
            `;
            const values = [userId];
            const result = await Database.query(query, values);

            if (result.rows.length > 0) {
                const spectatorLocationData = result.rows[0];
                return new SpectatorLocation(
                    spectatorLocationData.user_id,
                    spectatorLocationData.latitude,
                    spectatorLocationData.longitude,
                    spectatorLocationData.location,
                    spectatorLocationData.country_code
                );
            } else {
                return null;
            }
        } catch (error) {
            throw new Error((error as Error).message);
        }
    }
}



export default SpectatorLocation;
