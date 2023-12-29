import { EventSubMiddleware } from "@twurple/eventsub-http";

import Environment from "../../utils/environment";
import Twitch from "./Twitch.module";
import Channel from "../models/Channel.model";
import Utils from "../../lib/Utils";
import Redemption from "../models/Redemption.model";
import User from "../models/User.model";
import { Bot } from "../../bot";
import Workflow, { EventType } from "../models/Workflow.model";
import chalk from "chalk";
import EmailManager from "./EmailManager.module";
import TwitchAuthenticator from "./TwitchAuthenticator.module";
import UserToken from "../models/UserToken.model";
import SocketIO from "./SocketIO.module";
import Notification, { NotificationType } from "../models/Notification.model";

type EventSubSubscription = ReturnType<EventSubMiddleware['onChannelRedemptionAdd']>;


class TwitchEvents {
    // this have EventSubSubscription instances. It should be like eventSubListeners[channelId][eventName]
    private static eventSubListeners: { [key: string]: { [key: string]: EventSubSubscription } } = {};
    private static TwitchEventSub: EventSubMiddleware;
    private static bot: Bot;

    public static async setup(): Promise<void> {
        this.bot = await Bot.getInstance();
        this.TwitchEventSub = new EventSubMiddleware({
            apiClient: Twitch.HelixApp,
            hostName: Environment.hostname,
            pathPrefix: '/twitch/eventsub',
            secret: 'A.RANDOM.SECRET.PETRUQUIO.BOT'
        });

        this.TwitchEventSub.onRevoke(async (event) => {
            console.log(`[TWITCH EVENT SUB] Revoked subscription with ID ${event.id}`);
        });

        this.TwitchEventSub.onSubscriptionCreateFailure(async (event, error) => {
            console.log(`[TWITCH EVENT SUB] Failed to create subscription with ID ${event.id}`);
        });

    }

    public static async subscribeToChannelPoints(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onChannelRedemptionAdd(channel.twitchId.toString(), async (event) => {
            console.log(`[TWITCH EVENT SUB] Channel Points Redemption on #${event.broadcasterDisplayName} (${event.broadcasterName})`);
            console.log(`[TWITCH EVENT SUB] User: ${event.userDisplayName} (${event.userName})`);
            console.log(`[TWITCH EVENT SUB] Reward: ${event.rewardTitle}`);
            console.log(`[TWITCH EVENT SUB] Message: ${event.input}`);

            console.log(event)

            const channelData = await Channel.findByTwitchId(channel.twitchId);

            if (channelData) {
                try {
                    const user = await User.findByTwitchId(parseInt(event.userId));
                    const rewardInfo = await Twitch.Helix.channelPoints.getCustomRewardById(event.broadcasterId, event.rewardId);
                    await Redemption.create({
                        channel: channelData,
                        user: user,
                        eventId: event.id,
                        rewardId: event.rewardId,
                        redemptionDate: event.redemptionDate,
                        rewardCost: event.rewardCost,
                        rewardIcon: rewardInfo?.getImageUrl(2) || null,
                        rewardName: event.rewardTitle,
                        message: event.input,
                    });
                } catch (error) {
                    console.error(`[TWITCH EVENT SUB] Error while logging redemption: ${(error as Error).message}`);
                }

                const workflow = await Workflow.find(channelData, EventType.OnCustomRewardRedeemed);

                if (workflow) {
                    await workflow.execute(event);
                }

                if (channelData.preferences.enableFirstRanking?.value) {
                    if (!Utils.emptyString(channelData.preferences.firstRankingRewardId?.value)) {
                        if (channelData.preferences.firstRankingRewardId?.value === event.rewardId) {
                            console.log(`[TWITCH EVENT SUB] First Ranking Reward detected on channel ${event.broadcasterDisplayName} (${event.broadcasterName})`);
                            let redemeedMessage = `@${event.userDisplayName} has redeemed "${event.rewardTitle}" PopNemo`;
                            if (channelData.preferences.firstRankingRedeemedMessage?.value && !Utils.emptyString(channelData.preferences.firstRankingRedeemedMessage?.value)) {
                                redemeedMessage = channelData.preferences.firstRankingRedeemedMessage?.value.replace('#user', `@${event.userDisplayName}`).replace('#reward', event.rewardTitle);
                            }
                            this.bot.sendMessage(channelData, redemeedMessage);

                        } else {
                            /* 
                                TODO: In a future, we can add Workflows to the bot, so we can add more reward handlers here.
                                For example, trigger alerts, messages, webhooks, etc.
                            */
                        }
                    } else {
                        console.log(`[TWITCH EVENT SUB] First Ranking Reward enabled but not configured on channel ${event.broadcasterDisplayName} (${event.broadcasterName}). Skipping...`);
                    }
                }
            }
        });

        if (!this.eventSubListeners[channel.twitchId.toString()]) {
            this.eventSubListeners[channel.twitchId.toString()] = {};
        }

        this.eventSubListeners[channel.twitchId.toString()]['channel-points'] = listener;
    }

    public static async unsubscribeToChannelPoints(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['channel-points'];
        if (listener) {
            listener.stop();
        }
    }

    public static async subscribeToAppRevocation(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onUserAuthorizationRevoke(async (event) => {
            console.log(`[TWITCH EVENT SUB] App Revocation detected for ${event.userDisplayName} (${event.userName})`);
            console.log(`[TWITCH EVENT SUB] User: ${event.userDisplayName} (${event.userName})`);

            const user = await User.findByTwitchId(parseInt(event.userId));
            if (user) {
                const channel = await user.getChannel();
                if (channel) {
                    try {
                        await this.unsubscribeChannel(channel);
                    } catch (error) {
                        console.error(`[TWITCH EVENT SUB] Error while unsubscribing channel ${channel.twitchId} (${channel.user.username}): ${(error as Error).message}`);
                    }
                    channel.autoJoin = false;
                    await channel.save();
                    console.log(`[TWITCH EVENT SUB] Channel ${channel.twitchId} (${channel.user.username}) unsubscribed from all events.`);
                    console.log(`[TWITCH EVENT SUB] Disconnecting from channel ${channel.twitchId} (${channel.user.username})`);
                    this.bot.getBotClient().part(channel.user.username);
                    try {
                        console.log(`[TWITCH EVENT SUB] Deleting user token for ${channel.user.username}`);
                        await UserToken.findByUserId(user.twitchId).then(async (token) => {
                            if (token) {
                                await token.delete();
                            }
                        });
                        TwitchAuthenticator.RefreshingAuthProvider.removeUser(user.twitchId);
                    } catch (error) {
                        console.error(`[TWITCH EVENT SUB] Error while deleting user token for ${channel.user.username}: ${(error as Error).message}`);
                    }
                    if (!channel.user.email || !channel.user.displayName) {
                        console.log(`[TWITCH EVENT SUB] User ${channel.user.username} doesn't have an email configured. Skipping...`);
                        return;
                    }
                    try {
                        console.log(`[TWITCH EVENT SUB] Sending notification via email to ${channel.user.email}`);
                        EmailManager.getInstance().sendEmail({
                            to: [{ email: channel.user.email, name: channel.user.displayName }],
                            params: {
                                'TWITCH_USERNAME': channel.user.displayName,
                            },
                            templateId: 1,
                            subject: 'Tu cuenta de Twitch ha sido desconectada',
                        });
                        console.log(`[TWITCH EVENT SUB] Email sent to ${channel.user.email}`);
                    } catch (error) {
                        console.error(`[TWITCH EVENT SUB] Error while sending email to ${channel.user.email}: ${(error as Error).message}`);
                    }

                    try {
                        const notification = new Notification({
                            user: channel.user,
                            type: NotificationType.ACCOUNT_SECURITY,
                            title: 'Tu cuenta de Twitch ha sido desconectada',
                            message: `Hemos detectado que tu cuenta de Twitch ha sido desconectada de Petruquio.LIVE. Si no has sido tú, te recomendamos que cambies tu contraseña de Twitch y actives la autenticación de dos factores.`
                        })
                        await notification.save();
                    } catch (error) {
                        console.error(`[TWITCH EVENT SUB] Error while saving notification for ${channel.user.username}: ${(error as Error).message}`);
                    }
                }
            } else {
                console.log(`[TWITCH EVENT SUB] User ${event.userDisplayName} (${event.userName}) not found on database. Skipping...`);
            }

        });

        this.eventSubListeners[channel.twitchId.toString()]['app-revocation'] = listener;
    }

    public static async subscribeToLiveStream(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onStreamOnline(channel.twitchId.toString(), async (event) => {
            console.log(`[TWITCH EVENT SUB] Stream Online detected for ${event.broadcasterDisplayName} (${event.broadcasterName})`);
            console.log(`[TWITCH EVENT SUB] User: ${event.broadcasterDisplayName} (${event.broadcasterName})`);

            const streamInfo = await event.getStream();


            const channelData = await Channel.findByTwitchId(parseInt(event.broadcasterId));
            if (channelData) {
                if (channelData.preferences.enableLiveNotification?.value) {
                    let message = `@${event.broadcasterDisplayName} is now live on Twitch PopNemo`;

                    if (channelData.preferences.liveNotificationMessage?.value && !Utils.emptyString(channelData.preferences.liveNotificationMessage?.value)) {
                        message = channelData.preferences.liveNotificationMessage?.value
                        message = message.replace('#channel', `${event.broadcasterDisplayName}`);
                        message = message.replace('#game', streamInfo?.gameName || '');
                        message = message.replace('#title', streamInfo?.title || '');
                    }

                    this.bot.sendMessage(channelData, message);
                }

                const workflow = await Workflow.find(channel, EventType.OnStreamStarted);

                if (workflow) {
                    await workflow.execute({
                        ...event,
                        streamInfo,
                        channel: channelData,
                    });
                }
            } else {
                console.log(`[TWITCH EVENT SUB] Channel ${event.broadcasterDisplayName} (${event.broadcasterName}) not found on database. Skipping...`);
            }

        });
        this.eventSubListeners[channel.twitchId.toString()]['live-stream'] = listener;

        if (Environment.isDevelopment) {
            console.log(await listener.getCliTestCommand());
        }
    }



    public static async unsubscribeToAppRevocation(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['app-revocation'];
        if (listener) {
            listener.stop();
        }
    }

    public static async unsubscribeToLiveStream(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['live-stream'];
        if (listener) {
            listener.stop();
        }
    }

    public static async suscribeToUserUpdate(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onUserUpdate(channel.twitchId.toString(), async (event) => {
            console.log(`[TWITCH EVENT SUB] User Update detected for ${event.userDisplayName} (${event.userName})`);
            console.log(`[TWITCH EVENT SUB] User: ${event.userDisplayName} (${event.userName})`);

            const user = await User.findByTwitchId(parseInt(event.userId));
            if (user) {
                const channel = await user.getChannel();
                if (channel) {
                    channel.user.username = event.userName;
                    channel.user.displayName = event.userDisplayName;
                    await channel.user.save();
                    console.log(`[TWITCH EVENT SUB] Channel ${channel.twitchId} (${channel.user.username}) updated.`);
                }
            } else {
                console.log(`[TWITCH EVENT SUB] User ${event.userDisplayName} (${event.userName}) not found on database. Skipping...`);
            }

        });

        this.eventSubListeners[channel.twitchId.toString()]['user-update'] = listener;
    }

    public static async unsubscribeToUserUpdate(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['user-update'];
        if (listener) {
            listener.stop();
        }
    }

    public static async suscribeToStreamEnd(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onStreamOffline(channel.twitchId.toString(), async (event) => {
            console.log(`[TWITCH EVENT SUB] Stream Offline detected for ${event.broadcasterDisplayName} (${event.broadcasterName})`);
            console.log(`[TWITCH EVENT SUB] User: ${event.broadcasterDisplayName} (${event.broadcasterName})`);

            const channelData = await Channel.findByTwitchId(parseInt(event.broadcasterId));
            if (!channelData) {
                console.log(`[TWITCH EVENT SUB] Channel ${event.broadcasterDisplayName} (${event.broadcasterName}) not found on database. Skipping...`);
                return;
            }

            const workflow = await Workflow.find(channelData, EventType.OnStreamEnded)

            if (workflow) {
                await workflow.execute(event);
            }
        });

        this.eventSubListeners[channel.twitchId.toString()]['stream-end'] = listener;
    }

    public static async subscribeToFollows(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onChannelFollow(channel.twitchId.toString(), process.env.TWITCH_USER_ID || '', async (event) => {
            console.log(`[TWITCH EVENT SUB] Follow detected for ${event.userName}`);
            console.log(`[TWITCH EVENT SUB] User: ${event.userName}`);

            const user = await User.findByTwitchId(parseInt(event.broadcasterId));
            if (user) {
                const channel = await user.getChannel();
                if (channel) {
                    SocketIO.getInstance().emitEvent(`events:channel.${channel.twitchId}`, 'event', {
                        type: 'follow',
                        data: {
                            user: event.userName,
                        }
                    });
                    if (channel.preferences.enableFollowAlerts?.value) {
                        let message = `@${event.userName}, welcome in to the community! PopNemo`;

                        if (channel.preferences.followAlertMessages?.value && channel.preferences.followAlertMessages?.value.length > 0) {
                            message = channel.preferences.followAlertMessages?.value[Math.floor(Math.random() * channel.preferences.followAlertMessages?.value.length)];
                            message = message.replace('#user', `@${event.userName}`);
                        }

                        this.bot.sendMessage(channel, message);
                    }
                }
            } else {
                console.log(`[TWITCH EVENT SUB] User ${event.userName} not found on database. Skipping...`);
            }

        });

        this.eventSubListeners[channel.twitchId.toString()]['follows'] = listener;

        if (Environment.isDevelopment) {
            console.log(await listener.getCliTestCommand());
        }
    }

    public static async suscribeToBans(channel: Channel): Promise<void> {
        const listener = this.TwitchEventSub.onChannelBan(channel.twitchId.toString(), async (event) => {
            console.log(`[TWITCH EVENT SUB] Ban detected for ${event.userName}`);
            console.log(`[TWITCH EVENT SUB] User: ${event.userName}`);

            if (event.userName === 'alexitoo_uy') {
                try {
                    Twitch.Helix.asUser(process.env.TWITCH_USER_ID as string, async (client) => {
                        await client.moderation.unbanUser(channel.twitchId, event.userId);
                        const bot = await Bot.getInstance();
                        bot.sendMessage(channel, `@${event.userName}, sorry, but i can't allow you to ban my creator :(`);
                    });
                } catch (error) {
                    console.error(`[TWITCH EVENT SUB] Error while unbanning ${event.userName}: ${(error as Error).message}`);
                }

            }
        });

        this.eventSubListeners[channel.twitchId.toString()]['bans'] = listener;
    }

    public static async unsubscribeToFollows(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['follows'];
        if (listener) {
            listener.stop();
        }
    }

    public static async unsubscribeToBans(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['bans'];
        if (listener) {
            listener.stop();
        }
    }

    public static async unsubscribeToStreamEnd(channel: Channel): Promise<void> {
        const listener = this.eventSubListeners[channel.twitchId.toString()]['stream-end'];
        if (listener) {
            listener.stop();
        }
    }


    public static async subscribeChannel(channel: Channel): Promise<void> {
        await this.subscribeToChannelPoints(channel);
        await this.subscribeToAppRevocation(channel);
        await this.subscribeToLiveStream(channel);
        await this.suscribeToUserUpdate(channel);
        await this.subscribeToFollows(channel);
        await this.suscribeToStreamEnd(channel);
        await this.suscribeToBans(channel);
    }

    public static async unsubscribeChannel(channel: Channel): Promise<void> {
        await this.unsubscribeToChannelPoints(channel);
        await this.unsubscribeToAppRevocation(channel);
        await this.unsubscribeToLiveStream(channel);
        await this.unsubscribeToUserUpdate(channel);
        await this.unsubscribeToFollows(channel);
        await this.unsubscribeToStreamEnd(channel);
        await this.unsubscribeToBans(channel);

    }

    public static async subscribeAllChannels(): Promise<void> {

        const channels = await Channel.getAutoJoinChannels();
        for (const channel of channels) {
            if (!this.eventSubListeners[channel.twitchId.toString()]) {
                this.eventSubListeners[channel.twitchId.toString()] = {};
            }
            await this.subscribeChannel(channel);
        }
    }

    public static async unsubscribeAllChannels(): Promise<void> {
        const channels = await Channel.getAutoJoinChannels();
        for (const channel of channels) {
            try {
                await this.unsubscribeChannel(channel);
            } catch (error) {
                console.error(`[TWITCH EVENT SUB] Error while unsubscribing channel ${channel.twitchId} (${channel.user.username}): ${(error as Error).message}`);
            }
        }

        this.eventSubListeners = {};
    }

    public static get middleware(): EventSubMiddleware {
        return this.TwitchEventSub;
    }
    public static async markAsReady() {
        this.TwitchEventSub.markAsReady();
    }

    public static getListenersForChannel(channel: Channel): EventSubSubscription[] {
        const listeners: EventSubSubscription[] = [];
        for (const listener of Object.values(this.eventSubListeners[channel.twitchId.toString()])) {
            listeners.push(listener);
        }
        return listeners;
    }
}

export default TwitchEvents;