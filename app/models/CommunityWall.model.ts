import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import User from "./User.model";

export class Pixel {
    x: number;
    y: number;
    color: string;
    channel: Channel;
    user: User | null;

    constructor(x: number, y: number, color: string, channel: Channel, user: User | null = null) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.channel = channel;
        this.user = user || null;
    }

    async save(): Promise<void> {
        const query = `
      INSERT INTO community_walls (channel_id, user_id, x_coordinate, y_coordinate, color)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (channel_id, x_coordinate, y_coordinate) 
      DO UPDATE SET user_id = EXCLUDED.user_id, color = EXCLUDED.color;
    `;

        await Database.query(query, [this.channel.id, this.user?.twitchId, this.x, this.y, this.color]);

    }
}

export class CommunityWall {
    channel: Channel;
    pixels: Pixel[] = [];

    constructor(channel: Channel, pixels: Pixel[] = []) {
        this.channel = channel;
        this.pixels = pixels;
    }

    static async find(channel: Channel): Promise<CommunityWall> {
        const result = await Database.query(
            `SELECT * FROM community_walls WHERE channel_id = $1 ORDER BY inserted_at`,
            [channel.twitchId]
        );

        if (result.rows.length === 0) {
            return new CommunityWall(channel);
        }

        const pixels = result.rows.map(async (row) => {
            const user = await User.findByTwitchId(row.user_id);
            return new Pixel(row.x_coordinate, row.y_coordinate, row.color, channel, user);
        });

        return new CommunityWall(channel, await Promise.all(pixels));
    }
}

