import Database from "../../lib/Database";
import { ChannelPreferences, defaultChannelPreferences } from "../../utils/ChannelPreferences.class";
import { Command } from "./Command.model";
import User from "./User.model";
import WorldMap from "./WorldMap.model";


class Channel {
    id: number | undefined;
    twitchId: number;
    autoJoin: boolean;
    preferences: ChannelPreferences;
    user: User;

    constructor(twitchId: number, autoJoin: boolean, preferences: ChannelPreferences, user: User) {
        this.twitchId = twitchId;
        this.autoJoin = autoJoin;
        this.preferences = preferences;
        this.user = user;
    }

    public static async getAutoJoinChannels(): Promise<Channel[]> {
        const channelsData = await Database.query('SELECT * FROM channels WHERE auto_join = true');
        const channels: Channel[] = [];

        for (const channelData of channelsData.rows) {
            const user = await User.findByTwitchId(channelData.twitch_id);
            if (!user) {
                console.error(`User with Twitch ID ${channelData.twitch_id} not found`);
                continue;
            }
            const channel = new Channel(
                channelData.twitch_id,
                channelData.auto_join,
                channelData.preferences,
                user
            );
            channel.id = channelData.id; // Asigna el ID desde la base de datos
            channels.push(channel);
        }

        return channels;
    }

    public static async findByTwitchId(twitchId: number): Promise<Channel | null> {
        const query = 'SELECT * FROM channels WHERE twitch_id = $1';
        const values = [twitchId];
        const result = await Database.query(query, values);
    
        if (result.rows.length > 0) {
            const channelData = result.rows[0];
            const user = await User.findByTwitchId(channelData.twitch_id);
            if (!user) {
                console.error(`User with Twitch ID ${channelData.twitch_id} not found`);
                return null;
            }
            return new Channel(
                channelData.twitch_id,
                channelData.auto_join,
                {...defaultChannelPreferences, ...channelData.preferences},
                user
            );
        } else {
            return null;
        }
    }

    public static async findByUsername(username: string): Promise<Channel | null> {
        const user = await User.findByUsername(username);        
        if (!user) {
            console.error(`User with username ${username} not found`);
            return null;
        }
    
        const query = 'SELECT * FROM channels WHERE twitch_id = $1';
        const values = [user.twitchId];
        const result = await Database.query(query, values);
    
        if (result.rows.length > 0) {
            const channelData = result.rows[0];
            return new Channel(
                channelData.twitch_id,
                channelData.auto_join,
                {...defaultChannelPreferences, ...channelData.preferences},
                user
            );
        } else {
            return null;
        }
    }
    

    public async save(): Promise<void> {
        try {
            const query = 'INSERT INTO channels (twitch_id, auto_join, preferences) VALUES ($1, $2, $3) ON CONFLICT (twitch_id) DO UPDATE SET auto_join = $2, preferences = $3';
            const values = [this.twitchId, this.autoJoin, this.preferences];
            await Database.query(query, values);
        } catch (error) {
            console.error(error);
            throw new Error('Failed to save channel.');
        }
    }

    public async getWorldMap(): Promise<any[]> {
        return await WorldMap.getChannelWorldMap(this.twitchId);
    }

    public async getCommands(): Promise<any[]> {
        return await Command.getChannelCommands(this);
    }

    
    

    public static async findOrCreate(id: number): Promise<Channel> {
        const channel = await Channel.findByTwitchId(id);
        if (channel) {
            return channel;
        } else {
            const user = await User.findByTwitchId(id);
            if (!user) {
                throw new Error(`User with Twitch ID ${id} not found`);
            }
            const channel = new Channel(id, true, defaultChannelPreferences, user);
            await channel.save();
            return channel;
        }
    }
    

    async updatePreferences(preferences: ChannelPreferences): Promise<void> {
       try {
         const query = 'UPDATE channels SET preferences = $1::jsonb WHERE twitch_id = $2';
         const values = [preferences, this.user.twitchId];
         await Database.query(query, values);
       } catch (error) {
            console.error(error);
            throw new Error('Failed to update channel preferences.');
       }
    }
}

export default Channel;
