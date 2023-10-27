export interface ExpressUser {
    id: string;
    username: string;
    twitchId: string;
    email: string | null;
    displayName: string | null;
    session: {
        sessionId: number;
    };
    avatar: string;
}