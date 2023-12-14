import { ApiClient, HelixChatAnnouncementColor, HelixStream, HelixUser } from '@twurple/api'
import TwitchAuthenticator from './TwitchAuthenticator.module';
import chalk from 'chalk';
import { Bot } from '../../bot';
import Channel from '../models/Channel.model';
import MemoryVariables from '../../lib/MemoryVariables';
import TwitchEmoticons from '@mkody/twitch-emoticons';
import { ChatUserstate } from 'tmi.js';
const { EmoteFetcher, EmoteParser } = TwitchEmoticons;


class Twitch {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static Helix: ApiClient;
    public static HelixApp: ApiClient;
    // @ts-ignore
    public static EmoteFetcher: EmoteFetcher;
    public static firstCheck: boolean = true;


    public static async initialize(): Promise<void> {
        this.Helix = new ApiClient({
            authProvider: TwitchAuthenticator.RefreshingAuthProvider
        });

        this.HelixApp = new ApiClient({
            authProvider: TwitchAuthenticator.AppTokenAuthProvider
        });

        this.EmoteFetcher = new EmoteFetcher(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET, {
            apiClient: this.HelixApp
        });




        console.log(chalk.blue('[TWITCH MODULE]'), chalk.white('Twitch API initialized.'));
    }

    public static async isChannelLive(channelName: string): Promise<boolean> {
        const user = await this.Helix.users.getUserByName(channelName);
        if (!user) {
            throw new Error(`User ${channelName} not found.`);
        }
        const stream = await user.getStream();
        return stream !== null;
    }

    public static async shoutout(fromChannel: Channel, targetChannel: HelixUser): Promise<void> {
        const moderator = await this.Helix.users.getUserByName(Bot.username);

        if (!moderator) {
            throw new Error(`User ${Bot.username} not found.`);
        }

        const twitchShoutout = this.Helix.asUser(moderator, async api => {
            const shoutout = await api.chat.shoutoutUser(fromChannel.twitchId, targetChannel);
            return shoutout;
        });

        await twitchShoutout;
    }

    public static async getUser(username: string): Promise<HelixUser | null> {
        const user = await this.Helix.users.getUserByName(username);
        return user;
    }

    public static async getLiveChannels(channelList: string[]): Promise<HelixUser[]> {
        if (channelList.length === 0) {
            return [];
        }

        const channelGroups = [];
        const channelGroupSize = 100;
        for (let i = 0; i < channelList.length; i += channelGroupSize) {
            channelGroups.push(channelList.slice(i, i + channelGroupSize));
        }

        const liveChannels: HelixUser[] = [];

        for (const channelGroup of channelGroups) {
            const users = await this.Helix.users.getUsersByNames(channelGroup);
            for (const user of users) {
                const stream = await user.getStream();
                if (stream) {
                    liveChannels.push(user);
                }
            }
        }

        return liveChannels;
    }

    public static async getUsersByList(userList: string[]): Promise<HelixUser[]> {
        try {
            const users = await this.Helix.users.getUsersByNames(userList);
            return users;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    public static async checkLiveChannels(): Promise<void> {
        try {
            const bot = await Bot.getInstance();
            let channels;
            if(this.firstCheck) {
                channels = (await Channel.getAutoJoinChannels()).map(channel => channel.user.username);
                this.firstCheck = false;
            } else {
                channels = bot.getBotClient().getChannels().map(channel => channel.replace('#', ''));
            }
            const currentLive = await this.getLiveChannels(channels);

            const currentLiveChannels: HelixStream[] = [];

            currentLive.map(async user => {
                let liveStream = await user.getStream();
                if (liveStream) {
                    currentLiveChannels.push(liveStream);
                } else {
                    console.log(chalk.blue('[TWITCH MODULE]'), chalk.white(`User ${user.name} is not live.`));
                }
            })

            const newLiveChannels = currentLiveChannels.filter(channel => !MemoryVariables.getLiveChannels().includes(channel));
            const offlineChannels = MemoryVariables.getLiveChannels().filter(channel => !currentLiveChannels.includes(channel));

            if (newLiveChannels.length > 0) {
                console.log(chalk.blue('[TWITCH MODULE]'), chalk.white(`New live channels: ${newLiveChannels.map(channel => channel.userName).join(', ')}`));
            }

            if (offlineChannels.length > 0) {
                offlineChannels.forEach(channel => {
                    const index = MemoryVariables.getLiveChannels().indexOf(channel);
                    MemoryVariables.getLiveChannels().splice(index, 1);
                });
            }

            MemoryVariables.setLastLiveStreamsCheck(new Date());
            MemoryVariables.setLiveChannels(currentLiveChannels);
        } catch (error) {
            console.error(error);
        }
    }


    public static async initializeLiveMonitor(): Promise<void> {
        await this.checkLiveChannels(); // Check live channels on startup
        setInterval(async () => {
            console.log(chalk.blue('[TWITCH MODULE]'), chalk.white('Checking live channels...'));
            await this.checkLiveChannels();
        }, 2 * 60 * 1000);
    }

    public static async parseEmotes(channel: Channel, message: string, userstate: ChatUserstate, isMapPin?: boolean): Promise<string> {
        let parsedMessage = message; // Inicializa con el mensaje original
        const userStateEmotes = userstate.emotes;

        const stringReplacements: { stringToReplace: string, template: string }[] = [];

        // Procesa las sustituciones de emotes del userstate
        if (userStateEmotes) {
            Object.entries(userStateEmotes).forEach(([emoteId, emotePositions]) => {
                const position = emotePositions[0];
                const [start, end] = position.split('-');
                const stringToReplace = message.substring(
                    parseInt(start),
                    parseInt(end) + 1
                );

                let allowAnimatedPins = channel.preferences.enableAnimatedPins?.value;

                const template = isMapPin
                    ? allowAnimatedPins
                        ? `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/light/3.0`
                        : `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`
                    : `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/light/3.0" class="map-popup-emote">`;

                stringReplacements.push({
                    stringToReplace,
                    template,
                });
            });

            // Realiza las sustituciones en el mensaje
            stringReplacements.forEach((replacement) => {
                parsedMessage = parsedMessage.replace(replacement.stringToReplace, replacement.template);
            });
        }

        console.log('Fetching emotes...');
        try {
            await this.EmoteFetcher.fetchBTTVEmotes();
            await this.EmoteFetcher.fetchBTTVEmotes(channel.twitchId);
            await this.EmoteFetcher.fetchTwitchEmotes();
            await this.EmoteFetcher.fetchTwitchEmotes(channel.twitchId);
        } catch (error) {
            console.log(chalk.blue('[TWITCH MODULE]'), chalk.white('Error fetching emotes:'), error);
        }

        const parser = new EmoteParser(this.EmoteFetcher, {
            type: 'html',
            template: '<img alt="{name}" class="map-popup-emote" src="{link}">',
            match: /(\w+)/g,
        });

        // Realiza el parsing final con las sustituciones
        parsedMessage = parser.parse(parsedMessage, 2);

        return parsedMessage;
    }

    public static async sendAnnouncement(channel: Channel, message: string, color?: string): Promise<void> {
        try {
            const moderator = await this.Helix.users.getUserByName(Bot.username);
            const announcementColor : HelixChatAnnouncementColor = color as HelixChatAnnouncementColor;          

            if (!moderator) {
                throw new Error(`User ${Bot.username} not found.`);
            }

            const twitchAnnouncement = this.Helix.asUser(moderator, async api => {
                const announcement = await api.chat.sendAnnouncement(channel.twitchId, {
                    color: 'primary',
                    message,
                })
                console.log(announcement);
                return announcement;
            });

            await twitchAnnouncement;
        } catch (error) {
            console.error(error);
        }
    }

}

export default Twitch;