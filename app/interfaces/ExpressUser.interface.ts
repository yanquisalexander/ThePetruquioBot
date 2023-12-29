import Channel from "../models/Channel.model";

export interface ExpressUser {
    id: string;
    username: string;
    twitchId: string;
    email: string | null;
    displayName: string | null;
    session: {
        sessionId: number;
        impersonatedUserId: number | null;
        userId: number;
        createdAt: Date;
    };
    admin: boolean;
    unread_notifications_count: number;
    channel?: Channel;
    avatar: string;
}