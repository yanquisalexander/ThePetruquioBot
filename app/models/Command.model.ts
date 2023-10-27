// Command.ts

import { Bot } from "../../bot";
import Database from "../../lib/DatabaseManager";
import Utils from "../../lib/Utils";
import ChatUser from "../../utils/chat-user";
import Channel from "./Channel.model";
import User from "./User.model";


enum CommandPermission {
    VIEWER = 'viewer',
    FOLLOWER = 'follower',
    SUBSCRIBER = 'subscriber',
    VIP = 'vip',
    MODERATOR = 'moderator',
    BROADCASTER = 'broadcaster',
}

interface CommandPreferences {
    aliases?: string[];
    userCooldown?: number | 0; // Tiempo de enfriamiento por usuario en segundos
    globalCooldown?: number | 5; // Tiempo de enfriamiento global en segundos
}


class Command {
    id?: number;
    name: string;
    channelToExecute: string;
    permissions: CommandPermission[];
    description: string;
    preferences: CommandPreferences;
    response: string;
    /* 
        Callback should be used by system commands only
    */
    private callback?: (user: ChatUser, args: string[], channel: Channel, bot: Bot) => Promise<string | void>;


    constructor(
        name: string,
        channelToExecute: string,
        permissions: CommandPermission[],
        description: string,
        preferences: CommandPreferences,
        response: string,
        callback?: (user: ChatUser, args: string[], channel: Channel, bot: Bot) => Promise<string | void>,
        id?: number,
    ) {
        this.name = name;
        this.channelToExecute = channelToExecute;
        this.permissions = permissions;
        this.description = description;
        this.preferences = preferences;
        this.response = response;
        this.callback = callback;
        this.id = id;
    }

    getName() {
        return this.name;
    }

    getChannel() {
        return this.channelToExecute;
    }

    getPermissions() {
        return this.permissions;
    }

    getDescription() {
        return this.description;
    }

    getPreferences() {
        return this.preferences;
    }

    getResponse() {
        return this.response;
    }

    getCallback() {
        return this.callback;
    }

    async execute(user: ChatUser, args: string[], channel: Channel, bot: Bot): Promise<string | void> {
        if (this.callback) {
            return await this.callback(user, args, channel, bot);
        } else {
            const _user = await User.findByTwitchId(user.id);
            if(!_user) return ''
            
            return Utils.replaceVariables(this.response, channel, _user, args);
        }
    }

    async save(channel: Channel): Promise<void> {
        try {
            let query = '';
            let values = [];
    
            if (this.id) {
                // Si ya tienes un ID, actualiza el registro
                query = `
                    UPDATE commands 
                    SET 
                        name = $1, 
                        channel_id = $2, 
                        permissions = $3, 
                        description = $4, 
                        preferences = $5, 
                        response = $6
                    WHERE id = $7;
                `;
                values = [
                    this.name,
                    channel.twitchId,
                    JSON.stringify(this.permissions),
                    this.description,
                    JSON.stringify(this.preferences),
                    this.response,
                    this.id
                ];
            } else {
                // Si no tienes un ID, inserta un nuevo registro
                query = `
                    INSERT INTO commands (name, channel_id, permissions, description, preferences, response)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id, channel_id)
                    DO UPDATE SET
                      permissions = EXCLUDED.permissions,
                      description = EXCLUDED.description,
                      preferences = EXCLUDED.preferences,
                      response = EXCLUDED.response;
                `;
                values = [
                    this.name,
                    channel.twitchId,
                    JSON.stringify(this.permissions),
                    this.description,
                    JSON.stringify(this.preferences),
                    this.response
                ];
            }
    
            console.log(values);
            await Database.query(query, values);
        } catch (error) {
            console.error('Error al registrar comando:', error);
            throw new Error('Failed to save command.');
        }
    }
    

    async delete(channel: Channel): Promise<void> {
        try {
            const query = 'DELETE FROM commands WHERE name = $1 AND channel_id = $2';
            const values = [this.name, channel.twitchId];
            await Database.query(query, values);
        } catch (error) {
            console.error('Error al eliminar comando:', error);
            throw new Error('Failed to delete command.');
        }
    }

    static async findByIdAndChannel(id: number, channel: Channel): Promise<Command | null> {
        const query = 'SELECT * FROM commands WHERE id = $1 AND channel_id = $2';
        const values = [id, channel.twitchId];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            const commandData = result.rows[0];
            return new Command(
                commandData.name,
                commandData.channel_id,
                commandData.permissions,
                commandData.description,
                commandData.preferences,
                commandData.response,
                undefined,
                commandData.id
            );
        } else {
            return null;
        }
    }
        

    static async find(channel: Channel, name: string): Promise<Command | null> {
        const query = 'SELECT * FROM commands WHERE channel_id = $1 AND name = $2';
        const values = [channel.twitchId, name];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            const commandData = result.rows[0];
            return new Command(
                commandData.name,
                commandData.channel_id,
                commandData.permissions,
                commandData.description,
                commandData.preferences,
                commandData.response,
                undefined,
                commandData.id
            );
        } else {
            return null;
        }
    }

    static async getChannelCommands(channel: Channel): Promise<Command[]> {
        const query = 'SELECT * FROM commands WHERE channel_id = $1';
        const values = [channel.twitchId];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            return result.rows.map((commandData) => {
                return new Command(
                    commandData.name,
                    commandData.channel_id,
                    commandData.permissions,
                    commandData.description,
                    commandData.preferences,
                    commandData.response,
                    undefined,
                    commandData.id
                );
            });
        } else {
            return [];
        }
    }
}

export { Command, CommandPermission, CommandPreferences };
