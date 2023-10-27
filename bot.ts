import tmi, { client } from 'tmi.js';
import 'dotenv/config';
import Channel from './app/models/Channel.model';
import chalk from 'chalk';
import User from './app/models/User.model';
import UserToken from './app/models/UserToken.model';

const bootedAt = Date.now();

class ChannelBotInstance {
  /* This will allow us to have a custom instance for channel when they enable useStreamerAccount */
  public channel: Channel;
  public bot: tmi.Client | null = null;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  public async initialize(): Promise<void> {
    const token = await UserToken.findByUserId(this.channel.twitchId);
    if (!token) {
      throw new Error('User token not found');
    }

    this.bot = new tmi.Client({
      identity: {
        username: this.channel.user.username,
        password: token.tokenData.accessToken,
      },
      channels: [this.channel.user.username],
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
  private channels: string[] = []; // Almacena los canales
  private static channelInstances: ChannelBotInstance[] = []; // Almacena las instancias de los canales

  private constructor() {
    this.client = new tmi.Client({
      identity: {
        username: process.env.BOT_NAME,
        password: process.env.BOT_PASSWORD,
      },
      channels: this.channels, // Utiliza los canales almacenados
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
        username: process.env.BOT_NAME,
        password: process.env.BOT_PASSWORD,
      },
      channels: this.channels,
    });

    await this.initializeBotAccount();
  }

  private async initializeBotAccount(): Promise<void> {
    const user = await User.findByUsername(process.env.BOT_NAME as string);

    if (!user) {
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
    } else {
      const channel = await user.getChannel();
      if (!channel) {
        try {
          const botChannel = await user.createChannelWithPreferences();
        } catch (error) {
          console.error(chalk.red('[FATAL ERROR]'), chalk.white('Error creating bot channel:'), error);
        }
      }
    }

  }

  private async autoJoinChannels(): Promise<string[]> {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.green('[BOT]'), chalk.white('Development mode enabled. Joining development channels.'));
      const developmentChannels = process.env.CHANNELS?.split(',') || [];
      return developmentChannels;
    }
    const channels = await Channel.getAutoJoinChannels();
    const channelArray: string[] = [];
    for (const channel of channels) {
      channelArray.push(channel.user.username);
    }
    return channelArray;
  }

  public sendMessage(channel: Channel | string, message: string, platform: Platform = Platform.Twitch): void {
    if (platform === Platform.Twitch) {
      if(typeof channel === 'string') {
        this.client.say(channel, message);
        return;
      }
      this.client.say(channel.user.username, message);
    } else if (platform === Platform.Kick) {
      console.log({ channel, message, platform });
      //KickBot.say(channel, message);
    }
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
    return this.getBotClient().getChannels().map((channel) => channel.replace('#', ''));
  }

  public bootedAt(): number {
    return bootedAt;
  }

  public static get username(): string {
    const botName = process.env.BOT_NAME as string;
    return botName.toLowerCase();
  }

  public static getBotInstance(channel: Channel): ChannelBotInstance {
    return this.channelInstances.find((instance) => instance.channel.twitchId === channel.twitchId) as ChannelBotInstance;
  }

}
