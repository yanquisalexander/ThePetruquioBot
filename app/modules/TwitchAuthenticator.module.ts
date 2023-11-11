import axios from "axios";
import "dotenv/config";
import { RefreshingAuthProvider, AppTokenAuthProvider, TokenInfo, TokenInfoData, AccessToken, exchangeCode } from '@twurple/auth';
import chalk from "chalk";
import UserToken from "../models/UserToken.model";
import Environment from "../../utils/environment";

const TWITCH_SCOPES = [
    'analytics:read:extensions',
    'user:edit',
    'user:read:email',
    'clips:edit',
    'bits:read',
    'analytics:read:games',
    'user:edit:broadcast',
    'user:read:broadcast',
    'chat:read',
    'chat:edit',
    'channel:moderate',
    'channel:read:subscriptions',
    'whispers:read',
    'whispers:edit',
    'moderation:read',
    'channel:read:redemptions',
    'channel:edit:commercial',
    'channel:read:hype_train',
    'channel:read:stream_key',
    'channel:manage:extensions',
    'channel:manage:broadcast',
    'user:edit:follows',
    'channel:manage:redemptions',
    'channel:read:editors',
    'channel:manage:videos',
    'user:read:blocked_users',
    'user:manage:blocked_users',
    'user:read:subscriptions',
    'user:read:follows',
    'channel:manage:polls',
    'channel:manage:predictions',
    'channel:read:polls',
    'channel:read:predictions',
    'moderator:manage:automod',
    'channel:manage:schedule',
    'channel:read:goals',
    'moderator:read:automod_settings',
    'moderator:manage:automod_settings',
    'moderator:manage:banned_users',
    'moderator:read:blocked_terms',
    'moderator:manage:blocked_terms',
    'moderator:read:chat_settings',
    'moderator:manage:chat_settings',
    'channel:manage:raids',
    'moderator:manage:announcements',
    'moderator:manage:chat_messages',
    'user:manage:chat_color',
    'channel:manage:moderators',
    'channel:read:vips',
    'channel:manage:vips',
    'user:manage:whispers',
    'channel:read:charity',
    'moderator:read:chatters',
    'moderator:read:shield_mode',
    'moderator:manage:shield_mode',
    'moderator:read:shoutouts',
    'moderator:manage:shoutouts',
    'moderator:read:followers'
];

class TwitchAuthenticator {
    static clientId: string;
    static clientSecret: string;
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static AppTokenAuthProvider: AppTokenAuthProvider;
    public static RefreshingAuthProvider: RefreshingAuthProvider;


    public static async initialize(): Promise<void> {

        if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) throw new Error('TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not found');

        this.clientId = process.env.TWITCH_CLIENT_ID as string;
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET as string;

        this.AppTokenAuthProvider = new AppTokenAuthProvider(this.clientId, this.clientSecret, TWITCH_SCOPES);
        this.RefreshingAuthProvider = new RefreshingAuthProvider({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            // @ts-ignore
            onRefresh: async (userId, token) => {
                console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.white(`Refreshing token for user ${userId}`));
                const userToken = await UserToken.findByUserId(parseInt(userId));
                if (!userToken) {
                    throw new Error('User token not found');
                }
                userToken.tokenData = token;
                await userToken.save();
            },
            // @ts-ignore
            onRefreshFailure: (userId) => {
                console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.red(`Failed to refresh token for user ${userId}`));
            }
        });

        const userTokens = await UserToken.getAll();
        for (const userToken of userTokens) {
            console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.white(`Adding user ${userToken.userId} to the RefreshingAuthProvider`));
            this.RefreshingAuthProvider.addUser(userToken.userId, userToken.tokenData);
        }

        console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.white('Authenticator initialized.'));
    }

    public static async getAppAccessToken(): Promise<string> {
        const token = await this.AppTokenAuthProvider.getAppAccessToken();
        return token.accessToken;
    }

    public static async exchangeCode(code: string): Promise<AccessToken> {
        const token = await exchangeCode(this.clientId, this.clientSecret, code, `${Environment.websiteUrl}/api/auth/callback/twitch`);
        return token;
    }

    public static async validateToken(token: AccessToken): Promise<TokenInfoData> {
        try {
            const tokenInfo = await axios.get<TokenInfoData>('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`
                }
            });
            return tokenInfo.data;
        } catch (error) {
            console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.red('Failed to validate token'));
            throw error;
        }
    }

    public static async getUserInfo(token: AccessToken): Promise<any> {
        try {
            const userInfo = await axios.get('https://api.twitch.tv/helix/users', {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    'Client-Id': this.clientId
                }
            });
            return userInfo.data;
        } catch (error) {
            console.log(chalk.bgMagenta.bold('[TWITCH AUTHENTICATOR]'), chalk.red('Failed to get user info'));
            throw error;
        }
    }
}

export default TwitchAuthenticator;