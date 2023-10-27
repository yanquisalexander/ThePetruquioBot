import Channel from "../models/Channel.model";

export interface ExpressUser {
    id: string;
    username: string;
    twitchId: string;
    email: string | null;
    displayName: string | null;
    session: {
        sessionId: number;
    };
    channel?: Channel;
    avatar: string;
}