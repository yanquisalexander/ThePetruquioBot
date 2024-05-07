import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import User from "./User.model";

export enum AuditType {
    SETTING_UPDATED = 'SETTING_UPDATED',
    BOT_CONNECTED = 'BOT_CONNECTED',
    BOT_DISCONNECTED = 'BOT_DISCONNECTED',
    BOT_MUTED = 'BOT_MUTED',
    BOT_UNMUTED = 'BOT_UNMUTED',
    COMMAND_CREATED = 'COMMAND_CREATED',
    COMMAND_UPDATED = 'COMMAND_UPDATED',
    COMMAND_DELETED = 'COMMAND_DELETED',
    WORKFLOW_CREATED = 'WORKFLOW_CREATED',
    WORKFLOW_UPDATED = 'WORKFLOW_UPDATED',
    WORKFLOW_DELETED = 'WORKFLOW_DELETED',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    IMPERSONATED_BY_ADMIN = 'IMPERSONATED_BY_ADMIN',
    TOKEN_REFRESHED_BY_SYSTEM = 'TOKEN_REFRESHED_BY_SYSTEM',
    API_TOKEN_GENERATED = 'API_TOKEN_GENERATED',
}

export class AuditDTO {
    public id: number;
    public username: string;
    public displayName: string;
    public avatar: string;
    public type: AuditType;
    public data: any;
    public createdAt: Date;

    constructor(data: any) {
        this.id = data.id;
        this.username = data.username;
        this.displayName = data.displayName;
        this.avatar = data.avatar;
        this.type = data.type;
        this.data = data.data;
        this.createdAt = data.createdAt;
    }
}

interface AuditData {
    id?: number;
    channel: Channel;
    user: User;
    type: AuditType;
    data: any;
    createdAt?: Date;
}

class Audit {
    public id?: number | undefined;
    public channel: Channel;
    public user: User;
    public type: AuditType;
    public data: any;
    public createdAt?: Date | undefined;

    constructor(data: AuditData) {
        this.id = data.id;
        this.channel = data.channel;
        this.user = data.user;
        this.type = data.type;
        this.data = data.data;
        this.createdAt = data.createdAt;
    }

    public async save(): Promise<void> {
        const query = `
            INSERT INTO audits (channel_id, user_id, type, data)
            VALUES ($1, $2, $3, $4)
        `;
        const values = [
            this.channel.twitchId,
            this.user.twitchId,
            this.type,
            this.data
        ];

        await Database.query(query, values);
    }

    public static async getAudit(id: number): Promise<Audit> {
        const query = `
            SELECT * FROM audits WHERE id = $1
        `;
        const values = [id];
        const result = await Database.query(query, values);

        return new Audit(result.rows[0]);
    }

    public static async getAuditsByChannel(channel: Channel): Promise<AuditDTO[] | null> {
        const query = `
            SELECT audits.id, audits.type, audits.data, audits.created_at,
                   users.username, users.display_name, users.avatar
            FROM audits
            INNER JOIN users ON audits.user_id = users.twitch_id
            WHERE audits.channel_id = $1 ORDER BY audits.created_at DESC
        `;
        const values = [channel.twitchId];

        try {
            const result = await Database.query(query, values);

            const audits: AuditDTO[] = result.rows.map((row: any) => {
                return new AuditDTO({
                    id: row.id,
                    username: row.username,
                    displayName: row.display_name,
                    avatar: row.avatar,
                    type: row.type,
                    data: row.data,
                    createdAt: row.created_at
                });
            });

            return audits;
        } catch (error) {
            console.error("Error retrieving audits:", error);
            return null;
        }
    }
}

export default Audit;
