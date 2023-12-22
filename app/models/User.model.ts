import { HelixUser } from "@twurple/api";
import Database from "../../lib/DatabaseManager";
import { defaultChannelPreferences } from "../../utils/ChannelPreferences.class";
import Channel from "./Channel.model";
import Greeting from "./Greeting.model";
import MessageLogger from "./MessageLogger.model";
import Twitch from "../modules/Twitch.module";
import ExternalAccount, { ExternalAccountProvider } from "./ExternalAccount.model";


class User {
    username: string;
    twitchId: number;
    email?: string;
    displayName?: string;
    avatar?: string;
    admin?: boolean;
    birthday?: Date | null;

    constructor(username: string, twitchId: number, email?: string, displayName?: string, avatar?: string, admin?: boolean, birthday?: Date) {
        this.username = username;
        this.twitchId = twitchId;
        this.email = email;
        this.displayName = displayName;
        this.avatar = avatar;
        this.admin = admin || false;
        this.birthday = birthday;
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
                userData.admin,
                userData.birthday_date || null
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
                userData.admin,
                userData.birthday_date || null
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
                userData.admin,
                userData.birthday_date || null
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
        const query = 'INSERT INTO users (username, twitch_id, email, display_name, avatar, birthday_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (twitch_id) DO UPDATE SET username = $1, email = $3, display_name = $4, avatar = $5, birthday_date = $6 RETURNING twitch_id';
        const values = [this.username, this.twitchId, this.email, this.displayName, this.avatar, this.birthday];
        try {
            const result = await Database.query(query, values);
            this.twitchId = result.rows[0].twitch_id;
        } catch (error) {
            console.error(error);
            throw new Error('Error saving user: ' + error);
        }
    }

    isBirthdayToday(): boolean {
        if (!this.birthday) {
            return false;
        }
        const today = new Date();
        return this.birthday.getDate() === today.getDate() && this.birthday.getMonth() === today.getMonth();
    }

    async fromHelix(): Promise<HelixUser | null> {
        try {
            let user = await Twitch.getUser(this.username);
            return user;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    static async count(): Promise<number> {
        try {
            const result = await Database.query('SELECT COUNT(*) FROM users');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error(error);
            return 0;
        }
    }

    async getLinkedAccounts(): Promise<ExternalAccount[]> {
        return await ExternalAccount.findByUser(this);
    }

    async getLinkedAccount(provider: ExternalAccountProvider): Promise<ExternalAccount | null> {
        return await ExternalAccount.findByProviderAndUser(provider, this);
    }
}

export default User;
