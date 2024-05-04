import { v4 as uuidv4 } from 'uuid';
import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";


interface WidgetData {
    id?: string;
    name: string;
    preview?: string;
    isPrivate: boolean;
    json: any;
    createdAt: Date;
    updatedAt: Date;
    channel: Channel;
}

class Widget {
    id?: string;
    name: string;
    preview?: string;
    isPrivate: boolean;
    json: any;
    createdAt: Date;
    updatedAt: Date;
    channel: Channel;

    constructor(_data: WidgetData) {
        this.id = _data.id || uuidv4();
        this.name = _data.name;
        this.preview = _data.preview;
        this.isPrivate = _data.isPrivate;
        this.json = _data.json;
        this.createdAt = _data.createdAt;
        this.updatedAt = _data.updatedAt;
        this.channel = _data.channel;
    }

    async save() {
        try {
            const query = `INSERT INTO widgets (id, name, preview, is_private, json, created_at, updated_at, channel_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
            const values = [this.id, this.name, this.preview, this.isPrivate, this.json, this.createdAt, this.updatedAt, this.channel.twitchId];
            await Database.query(query, values);
        } catch (error) {
            console.log(error);
            throw new Error('Error saving widget to database.');
        }
    }

    async update() {
        try {
            const query = `UPDATE widgets SET name = $1, preview = $2, is_private = $3, json = $4, updated_at = $5 WHERE id = $6`;
            const values = [this.name, this.preview, this.isPrivate, this.json, this.updatedAt, this.id];
            await Database.query(query, values);
        } catch (error) {
            console.log(error);
            throw new Error('Error updating widget in database.');
        }
    }

    async delete() {
        try {
            const query = `DELETE FROM widgets WHERE id = $1`;
            const values = [this.id];
            await Database.query(query, values);
        } catch (error) {
            console.log(error);
            throw new Error('Error deleting widget from database.');
        }
    }

    static async findByChannel(_channel: Channel): Promise<Widget[]> {
        try {
            const query = `SELECT * FROM widgets WHERE channel_id = $1`;
            const values = [_channel.twitchId];
            const result = await Database.query(query, values);
            const widgets: Widget[] = [];
            for (const row of result.rows) {
                const widget = new Widget({
                    id: row.id,
                    name: row.name,
                    preview: row.preview,
                    isPrivate: row.is_private,
                    json: row.json,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    channel: _channel
                });
                widgets.push(widget);
            }
            return widgets;
        } catch (error) {
            console.log(error);
            throw new Error('Error finding widgets in database.');
        }
    }

    static async find(_id: string, channel: Channel): Promise<Widget> {
        try {
            const query = `SELECT * FROM widgets WHERE id = $1 AND channel_id = $2`;
            const values = [_id, channel.twitchId];
            const result = await Database.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Widget not found.');
            }
            const row = result.rows[0];

            const widget = new Widget({
                id: row.id,
                name: row.name,
                preview: row.preview,
                isPrivate: row.is_private,
                json: row.json,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                channel: channel
            });

            return widget;
        } catch (error) {
            console.log(error);
            throw new Error('Error finding widget in database.');
        }
    }

    static async findPublic(_id: string): Promise<any> {
        try {
            const query = `SELECT json, channel_id FROM widgets WHERE id = $1`;
            const values = [_id];
            const result = await Database.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Widget not found.');
            }
            const row = result.rows[0];

            return {
                json: row.json,
                channel_id: row.channel_id
            };

        } catch (error) {
            console.log(error);
            throw new Error('Error finding widget in database.');
        }
    }
}


export default Widget;