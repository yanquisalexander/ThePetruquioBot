import Database from "../../lib/DatabaseManager";
import { defaultChannelPreferences } from "../../utils/ChannelPreferences.class";
import Channel from "./Channel.model";
import Greeting from "./Greeting.model";
import MessageLogger from "./MessageLogger.model";

class User {
    username: string;
    twitchId: number;
    email?: string;
    displayName?: string;
    avatar?: string;
    admin?: boolean;

    constructor(username: string, twitchId: number, email?: string, displayName?: string, avatar?: string, admin?: boolean) {
        this.username = username;
        this.twitchId = twitchId;
        this.email = email;
        this.displayName = displayName;
        this.avatar = avatar;
        this.admin = admin || false;
    }

    public static async findByUsername(username: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE username ILIKE $1';
        const values = [username];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            const userData = result.rows[0];
            return new User(
                userData.username,
                userData.twitch_id,
                userData.email,
                userData.display_name || userData.username,
                userData.avatar || null,
                userData.admin
            );
        } else {
            return null;
        }
    }

    public static async findByTwitchId(twitchId: number): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE twitch_id = $1';
        const values = [twitchId];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            const userData = result.rows[0];
            return new User(
                userData.username,
                userData.twitch_id,
                userData.email,
                userData.display_name || userData.username,
                userData.avatar || null,
                userData.admin
            );
        } else {
            return null;
        }
    }

    public static async findAll(): Promise<User[]> {
        const query = 'SELECT * FROM users';
        const result = await Database.query(query);

        const users: User[] = [];
        for (const userData of result.rows) {
            users.push(new User(
                userData.username,
                userData.twitch_id,
                userData.email,
                userData.display_name || userData.username,
                userData.avatar || null,
                userData.admin
            ));
        }

        return users;
    }

    public async getChannel(): Promise<Channel | null> {
        return Channel.findByTwitchId(this.twitchId);
    }

    async getMessages(): Promise<any[]> {
        return await MessageLogger.getByUser(this);
    }

    public async getGreetingsData(): Promise<any> {
        return await Greeting.getByUser(this);
    }

    async createChannelWithPreferences(): Promise<Channel> {
        const channel = await Channel.findByTwitchId(this.twitchId);
        if (!channel) {
            const newChannel = new Channel(this.twitchId, false, defaultChannelPreferences, this);
            newChannel.save();
            return newChannel;
        }
        return channel;
    }

    public async save(): Promise<void> {
        const query = 'INSERT INTO users (username, twitch_id, email, display_name, avatar) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (twitch_id) DO UPDATE SET username = $1, email = $3, display_name = $4, avatar = $5 RETURNING twitch_id';
        const values = [this.username, this.twitchId, this.email, this.displayName, this.avatar];
        const result = await Database.query(query, values);
        this.twitchId = result.rows[0].twitch_id;
    }
}

export default User;
