import tmi from 'tmi.js'
import 'dotenv/config'
import Channel from '@/app/models/Channel.model'
import chalk from 'chalk'
import User from '@/app/models/User.model'
import UserToken from '@/app/models/UserToken.model'
import Twitch from '@/app/modules/Twitch.module'
import { Configuration } from '@/app/config'
import { handleClearedChat } from './app/bot/cleared-chat-handler'
import { handleBotConnected } from './app/bot/connected-handler'
import { handleBotJoin } from './app/bot/join-handler'
import { handleChatMessage } from './app/bot/message-handler'
import { noticeHandler } from './app/bot/notice-handler'
import { pongHandler } from './app/bot/pong-handler'
import MessageLogger from './app/models/MessageLogger.model'

const bootedAt = Date.now()

const EventHandlers = {
  join: handleBotJoin,
  message: handleChatMessage,
  clearchat: handleClearedChat,
  connected: handleBotConnected,
  pong: pongHandler,
  notice: noticeHandler
}

class ChannelBotInstance {
  public channel: Channel
  public bot: tmi.Client | null = null

  constructor (channel: Channel) {
    this.channel = channel
  }

  public async initializeBot (): Promise<void> {
    const token = await UserToken.findByUserId(this.channel.twitchId)
    if (!token) {
      throw new Error('User token not found')
    }

    console.log(chalk.green('[BOT]'), chalk.white('Initializing bot instance for channel #'), chalk.green(this.channel.user.username))
    this.bot = new tmi.Client({
      identity: {
        username: this.channel.user.username,
        password: `oauth:${token.tokenData.accessToken}`
      },
      channels: [this.channel.user.username]
    })

    this.bot.connect().catch((error) => {
      console.error(chalk.red('[BOT]'), chalk.white('Error connecting bot:'), error)
      this.bot = null // Reset bot instance
    })
  }
}

export enum Platform {
  TWITCH = 'twitch',
  KICK = 'kick',
}

export class Bot {
  private static instance: Bot
  private readonly client: tmi.Client
  private channels: string[] = []
  private static readonly channelInstances = new Map<number, ChannelBotInstance>()
  private BotUserInstance: User | null = null

  private constructor () {
    this.client = new tmi.Client({
      identity: {
        username: Configuration.BOT_NAME,
        password: Configuration.BOT_PASSWORD
      },
      channels: this.channels
    })
  }

  public static async getInstance (): Promise<Bot> {
    if (!this.instance) {
      this.instance = new Bot()
      await this.instance.initialize()
    }
    return this.instance
  }

  private async initialize (): Promise<void> {
    this.channels = await this.autoJoinChannels()
    for (const event of Object.keys(EventHandlers) as Array<keyof typeof EventHandlers>) {
      console.log(chalk.bgCyan.bold('[Bot EventHandlers]'), chalk.white(`Registering event handler for ${event}`))
      this.client.on(event, EventHandlers[event])
    }
    await this.initializeBotAccount()
    await this.client.connect()
    console.log(chalk.green('[BOT]'), chalk.white('Bot connected. Joining channels...'))
    for (const channel of this.channels) {
      try {
        await this.joinChannel(channel)
      } catch (error) {
        console.error(chalk.red('[BOT]'), chalk.white('Error joining channel:'), error)
      }
    }
  }

  private async initializeBotAccount (): Promise<void> {
    const user = await User.findByUsername(Configuration.BOT_NAME.toLowerCase())

    if (!user) {
      await this.createBotAccount()
    } else {
      let channel = await user.getChannel()
      if (!channel) {
        await user.createChannelWithPreferences()
        channel = await user.getChannel()
        if (!channel) {
          throw new Error('Error creating channel')
        }
      }
      this.BotUserInstance = user
    }
  }

  private async createBotAccount (): Promise<void> {
    const botUsername = Configuration.BOT_NAME.toLowerCase()
    const botUserId = Configuration.TWITCH_USER_ID

    console.log(chalk.yellow('[BOT]'), chalk.white('Bot account not found. Creating...'))

    if (!botUsername || !botUserId) {
      console.error(chalk.red('[FATAL ERROR]'), chalk.white('Bot username or user ID not found.'))
      process.exit(1)
    }

    try {
      const newBotUser = new User(botUsername.toLowerCase(), parseInt(botUserId))
      await newBotUser.save()
      console.log(chalk.green('[BOT]'), chalk.white('Bot account created.'))
    } catch (error) {
      console.error(chalk.red('[FATAL ERROR]'), chalk.white('Error creating bot account:'), error)
      process.exit(1)
    }
  }

  private async autoJoinChannels (): Promise<string[]> {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.green('[BOT]'), chalk.white('Development mode enabled. Joining development channels.'))
      const developmentChannels = Configuration.DEVELOPMENT_CHANNELS
      console.log(chalk.green('[BOT]'), chalk.white('Development channels:'), developmentChannels)
      return developmentChannels
    }
    const channels = await Channel.getAutoJoinChannels()
    return channels.map((channel) => channel.user.username)
  }

  public async sendMessage (channel: Channel, message: string, platform: Platform = Platform.TWITCH): Promise<void> {
    const sendTwitchMessage = async (target: string): Promise<void> => {
      try {
        await this.client.say(target, message)
        if (this.BotUserInstance && (channel.twitchId !== this.BotUserInstance.twitchId)) {
          await MessageLogger.logMessage({
            channel,
            sender: this.BotUserInstance,
            content: message,
            timestamp: new Date()
          })
        }
      } catch (error) {
        console.error(chalk.red('[BOT]'), chalk.white('Error sending message:'), error)
      }
    }

    if (platform === Platform.TWITCH) {
      if (typeof channel === 'string') {
        await sendTwitchMessage(channel)
        return
      }

      if (channel.preferences.botMuted?.value) {
        console.log(chalk.yellow('[BOT]'), chalk.white('Bot muted in channel #'), chalk.green(channel.user.username))
        return
      }

      if (message.startsWith('/announce')) {
        this.handleAnnouncement(channel, message)
        return
      }

      if (channel.preferences.useStreamerAccount?.value) {
        const instance = Bot.getStreamerBotInstance(channel)
        if (instance && instance.bot) {
          try {
            await instance.bot?.say(channel.user.username, message)
          } catch (error) {
            console.error(chalk.red('[BOT]'), chalk.white('Error sending message:'), error)
            await sendTwitchMessage(channel.user.username)
          }
          return
        } else {
          Bot.channelInstances.delete(channel.twitchId)
        }

        console.log(chalk.yellow('[BOT]'), chalk.white('Bot instance not found for channel #'), chalk.green(channel.user.username))
        const newInstance = new ChannelBotInstance(channel)
        this.initializeBotInstance(newInstance)
        try {
          await newInstance.bot?.say(channel.user.username, message)
        } catch (error) {
          console.error(chalk.red('[BOT]'), chalk.white('Error sending message:'), error)
          await sendTwitchMessage(channel.user.username)
          return
        }
      }

      await sendTwitchMessage(channel.user.username)
      return
    }

    if (platform === Platform.KICK) {
      console.log({ channel, message, platform })
      // KickBot.say(channel, message);
    }
  }

  private handleAnnouncement (channel: Channel, message: string): void {
    const announcePattern = /\/announce(\w*)\s(.+)/
    const match = message.match(announcePattern)

    if (match) {
      const announceType = match[1] || 'primary'
      const announcementMessage = match[2]

      Twitch.sendAnnouncement(channel, announcementMessage, announceType)
        .then(() => {
          console.log(chalk.green('[BOT]'), chalk.white(`Announcement sent in channel #${channel.user.username} (Type: ${announceType}) - Message: ${announcementMessage}`))
        })
        .catch((error) => {
          console.error(chalk.red('[BOT]'), chalk.white(`Error sending announcement in channel #${channel.user.username} (Type: ${announceType}) - Error: ${error}`))
        })
    } else {
      console.log(chalk.yellow('[BOT]'), chalk.white('Invalid announcement command.'))
    }
  }

  private initializeBotInstance (instance: ChannelBotInstance): void {
    Bot.channelInstances.set(instance.channel.twitchId, instance)
    instance.initializeBot().catch((error) => {
      console.error(chalk.red('[BOT]'), chalk.white('Error initializing bot instance:'), error)
    })
  }

  public getBotClient (): tmi.Client {
    return this.client
  }

  public async joinChannel (channel: string): Promise<void> {
    try {
      await this.client.join(channel)
    } catch (error) {
      console.error(chalk.red('[BOT]'), chalk.white('Error joining channel:'), error)
    }
  }

  get joinedChannels (): string[] {
    return this.client.getChannels().map((channel) => channel.replace('#', ''))
  }

  public bootedAt (): number {
    return bootedAt
  }

  public static get username (): string {
    return Configuration.BOT_NAME.toLowerCase()
  }

  public static getStreamerBotInstance (channel: Channel): ChannelBotInstance | null {
    return Bot.channelInstances.get(channel.twitchId) ?? null
  }
}
