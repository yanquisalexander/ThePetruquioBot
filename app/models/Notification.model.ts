import Database from "../../lib/DatabaseManager";
import User from "./User.model";

export enum NotificationType {
    ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
    NEW_FEATURE = 'NEW_FEATURE',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    OTHER = 'OTHER',
}

interface NotificationData {
    id?: number;
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    read?: boolean | undefined;
    createdAt?: Date;
}


class Notification {
    public id: number | undefined;
    public user: User;
    public type: NotificationType;
    public title: string;
    public message: string;
    public read: boolean = false;
    public createdAt: Date;

    constructor(data: NotificationData) {
        this.id = data.id 
        this.user = data.user;
        this.type = data.type;
        this.title = data.title;
        this.message = data.message;
        this.read = data.read || false;
        this.createdAt = new Date();
    }

    public async save(): Promise<void> {
        const query = `
            INSERT INTO notifications (user_id, type, title, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [this.user.twitchId, this.type, this.title, this.message];
        const result = await Database.query(query, values);

        this.id = result.rows[0].id;
        this.createdAt = result.rows[0].created_at;
    }

    public async markAsRead(): Promise<void> {
        const query = `
            UPDATE notifications
            SET read = true
            WHERE id = $1
        `;
        const values = [this.id];
        await Database.query(query, values);

        this.read = true;
    }

    public static async findByUser(user: User): Promise<Notification[]> {
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const values = [user.twitchId];
        const result = await Database.query(query, values);
        const notifications: Notification[] = [];

        for (const notificationData of result.rows) {
            const notification = new Notification(notificationData);
            notifications.push(notification);
        }

        return notifications;
    }

    public static async getUnreadCount(user: User): Promise<number> {
        const query = `
            SELECT COUNT(*) FROM notifications
            WHERE user_id = $1 AND read = false
        `;
        const values = [user.twitchId];
        const result = await Database.query(query, values);

        return parseInt(result.rows[0].count);
    }

    public static async createForAllUsers(type: NotificationType, title: string, message: string): Promise<void> {
        const query = `
            INSERT INTO notifications (user_id, type, title, message)
            SELECT twitch_id, $1, $2, $3 FROM users
        `;
        const values = [type, title, message];
        await Database.query(query, values);
    }
}

export default Notification;