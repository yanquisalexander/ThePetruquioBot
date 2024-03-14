import chalk from 'chalk'
import dotenv from 'dotenv'

import MonkeyPatches from './lib/MonkeyPatches'
import Database from './lib/DatabaseManager'
import { Bot } from './bot'
import CommandExecutor from './lib/CommandExecutor'
import TwitchAuthenticator from './app/modules/TwitchAuthenticator.module'
import Twitch from './app/modules/Twitch.module'
import GreetingsManager from './app/modules/GreetingsManager.module'
import WebServer from './app/modules/WebServer.module'
import TwitchEvents from './app/modules/TwitchEvents.module'
import Environment from './utils/environment'
import Passport from './lib/Passport'
import EmailManager from './app/modules/EmailManager.module'

MonkeyPatches.apply()

Database.connect()

const initializeApp = async (): Promise<void> => {
  try {
    dotenv.config()
    const bot = await Bot.getInstance()

    Environment.https = process.env.HTTPS === 'true'

    CommandExecutor.initialize()
    // StreamCopilot.initialize(process.env.OPENAI_API_KEY!);

    await Passport.setup()

    await TwitchAuthenticator.initialize()
    await Twitch.initialize()
    await Twitch.initializeLiveMonitor()

    GreetingsManager.initialize()
    EmailManager.initialize()

    try {
      await Bot.getInstance() // Initialize the bot instance
    } catch (error) {
      console.warn(chalk.yellow('[APP ERROR]'), error)
    }

    try {
      await bot.joinChannel(bot.getBotClient().getUsername())
    } catch (error) {

    } // Join the bot's own channel for self-user settings

    /* Twitch Events should be initialized before the web server */
    await TwitchEvents.setup()
    await WebServer.boot()

    console.log(chalk.bgCyan.bold('[APP]'), chalk.white('All services initialized.'))
  } catch (error) {
    console.error(chalk.red('[APP ERROR]'), error)
  }
}

initializeApp().catch((error) => {
  console.error(chalk.red('[APP ERROR]'), error)
})

process.on('uncaughtException', (err) => {
  console.error('Asynchronous error caught.', err)
})
