import tmi from 'tmi.js';
import 'dotenv/config';
import Channel from './app/models/Channel.model';
import chalk from 'chalk';
import User from './app/models/User.model';
import UserToken from './app/models/UserToken.model';
import Twitch from './app/modules/Twitch.module';

const bootedAt = Date.now();

class ChannelBotInstance {
  public channel: Channel;
  public bot: tmi.Client | null = null;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  public async initializeBot(): Promise<void> {
    const token = await UserToken.findByUserId(this.channel.twitchId);
    if (!token) {
      throw new Error('User token not found');
    }

    console.log(chalk.green('[BOT]'), chalk.white('Initializing bot instance for channel #'), chalk.green(this.channel.user.username));
    this.bot = new tmi.Client({
      identity: {
        username: this.channel.user.username,
        password: `oauth:${token.tokenData.accessToken}`,
      },
      channels: [this.channel.user.username],
    });

    this.bot.connect().catch((error) => {
      console.error(chalk.red('[BOT]'), chalk.white('Error connecting bot:'), error);
      this.bot = null; // Reset bot instance
    });
  }
}

export enum Platform {
  Twitch = 'twitch',
  Kick = 'kick',
}

export class Bot {
  private static instance: Bot;
  private client: tmi.Client;
  private channels: string[] = [];
  private static channelInstances: Map<number, ChannelBotInstance> = new Map();

  private constructor() {
    this.client = new tmi.Client({
      identity: {
        username: process.env.BOT_NAME!,
        password: process.env.BOT_PASSWORD!,
      },
      channels: this.channels,
    });
  }

  public static async getInstance(): Promise<Bot> {
    if (!this.instance) {
      this.instance = new Bot();
      await this.instance.initialize();
    }
    return this.instance;
  }

  private async initialize(): Promise<void> {
    this.channels = await this.autoJoinChannels();
    this.client = new tmi.Client({
      identity: {
        username: process.env.BOT_NAME!,
        password: process.env.BOT_PASSWORD!,
      },
      channels: this.channels,
    });

    await this.initializeBotAccount();
  }

  private async initializeBotAccount(): Promise<void> {
    const user = await User.findByUsername(process.env.BOT_NAME!);

    if (!user) {
      await this.createBotAccount();
    } else {
      let channel = await user.getChannel();
      if (!channel) {
        await user.createChannelWithPreferences();
        channel = await user.getChannel();

        if (!channel) {
          throw new Error('Error creating channel');
        }
      }
      const token = await UserToken.findByUserId(channel.twitchId);
      if (token) {
        const newInstance = new ChannelBotInstance(channel);
        await newInstance.initializeBot();
        if (newInstance.bot) {
          this.initializeBotInstance(newInstance);
        }
        Bot.channelInstances.set(channel.twitchId, newInstance);
      }
    }
  }

  private async createBotAccount(): Promise<void> {
    const botUsername = process.env.BOT_NAME as string;
    const botUserId = process.env.TWITCH_USER_ID as string;

    console.log(chalk.yellow('[BOT]'), chalk.white('Bot account not found. Creating...'));

    if (!botUsername || !botUserId) {
      console.error(chalk.red('[FATAL ERROR]'), chalk.white('Bot username or user ID not found.'));
      process.exit(1);
    }

    try {
      const newBotUser = new User(botUsername.toLowerCase(), parseInt(botUserId));
      await newBotUser.save();
      console.log(chalk.green('[BOT]'), chalk.white('Bot account created.'));
    } catch (error) {
      console.error(chalk.red('[FATAL ERROR]'), chalk.white('Error creating bot account:'), error);
      process.exit(1);
    }
  }

  private async autoJoinChannels(): Promise<string[]> {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.green('[BOT]'), chalk.white('Development mode enabled. Joining development channels.'));
      const developmentChannels = process.env.CHANNELS?.split(',') || [];
      return developmentChannels;
    }
    const channels = await Channel.getAutoJoinChannels();
    return channels.map((channel) => channel.user.username);
  }

  public sendMessage(channel: Channel, message: string, platform: Platform = Platform.Twitch): void {
    if (platform === Platform.Twitch) {
      if (typeof channel === 'string') {
        this.client.say(channel, message);
        return;
      }

      if (channel.preferences.botMuted?.value) {
        console.log(chalk.yellow('[BOT]'), chalk.white('Bot muted in channel #'), chalk.green(channel.user.username));
        return;
      }

      if (message.startsWith('/announce')) {
        this.handleAnnouncement(channel, message);
        return;
      }

      if (channel.preferences.useStreamerAccount?.value) {

        const instance = Bot.getStreamerBotInstance(channel);
        if (instance && instance.bot) {
          instance.bot?.say(channel.user.username, message);
          return;
        } else {
          Bot.channelInstances.delete(channel.twitchId);
        }

        console.log(chalk.yellow('[BOT]'), chalk.white('Bot instance not found for channel #'), chalk.green(channel.user.username));
        const newInstance = new ChannelBotInstance(channel);
        this.initializeBotInstance(newInstance);
        try {
          newInstance.bot?.say(channel.user.username, message);
        } catch (error) {
          console.error(chalk.red('[BOT]'), chalk.white('Error sending message:'), error);
          this.client.say(channel.user.username, message);
          return
        }
      }

      this.client.say(channel.user.username, message);
      return
    }

    if (platform === Platform.Kick) {
      console.log({ channel, message, platform });
      // KickBot.say(channel, message);
    }
  }

  private handleAnnouncement(channel: Channel, message: string): void {
    const announcePattern = /\/announce(\w*)\s(.+)/;
    const match = message.match(announcePattern);

    if (match) {
      const announceType = match[1] || 'primary';
      const announcementMessage = match[2];

      Twitch.sendAnnouncement(channel, announcementMessage, announceType)
        .then(() => {
          console.log(chalk.green('[BOT]'), chalk.white(`Announcement sent in channel #${channel.user.username} (Type: ${announceType}) - Message: ${announcementMessage}`));
        })
        .catch((error) => {
          console.error(chalk.red('[BOT]'), chalk.white(`Error sending announcement in channel #${channel.user.username} (Type: ${announceType}) - Error: ${error}`));
        });
    } else {
      console.log(chalk.yellow('[BOT]'), chalk.white('Invalid announcement command.'));
    }
  }

  private initializeBotInstance(instance: ChannelBotInstance): void {
    Bot.channelInstances.set(instance.channel.twitchId, instance);
    instance.initializeBot().catch((error) => {
      console.error(chalk.red('[BOT]'), chalk.white('Error initializing bot instance:'), error);
    });
  }

  public getBotClient(): tmi.Client {
    return this.client;
  }

  public async joinChannel(channel: string): Promise<void> {
    try {
      await this.client.join(channel);
    } catch (error) {
      console.error(chalk.red('[BOT]'), chalk.white('Error joining channel:'), error);
    }
  }

  get joinedChannels(): string[] {
    return this.client.getChannels().map((channel) => channel.replace('#', ''));
  }

  public bootedAt(): number {
    return bootedAt;
  }

  public static get username(): string {
    return process.env.BOT_NAME!.toLowerCase();
  }

  public static getStreamerBotInstance(channel: Channel): ChannelBotInstance | null {
    return Bot.channelInstances.get(channel.twitchId) || null;
  }
}
