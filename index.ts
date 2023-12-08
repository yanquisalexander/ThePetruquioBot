import chalk from "chalk";
import dotenv from "dotenv";

import MonkeyPatches from "./lib/MonkeyPatches";
import Database from "./lib/DatabaseManager";
import { Bot } from "./bot";
import { handleBotJoin } from "./app/bot/join-handler";
import { handleChatMessage } from "./app/bot/message-handler";
import { handleClearedChat } from "./app/bot/cleared-chat-handler";
import CommandExecutor from "./lib/CommandExecutor";
import { handleBotConnected } from "./app/bot/connected-handler";
import TwitchAuthenticator from "./app/modules/TwitchAuthenticator.module";
import Twitch from "./app/modules/Twitch.module";
import { pongHandler } from "./app/bot/pong-handler";
import { noticeHandler } from "./app/bot/notice-handler";
import GreetingsManager from "./app/modules/GreetingsManager.module";
import WebServer from "./app/modules/WebServer.module";
import TwitchEvents from "./app/modules/TwitchEvents.module";
import Environment from "./utils/environment";
import Passport from "./lib/Passport";
import SocketIO from "./app/modules/SocketIO.module";
import Shoutout from "./app/models/Shoutout.model";

MonkeyPatches.apply();

Database.connect();

const EventHandlers = {
    'join': handleBotJoin,
    'message': handleChatMessage,
    'clearchat': handleClearedChat,
    'connected': handleBotConnected,
    'pong': pongHandler,
    'notice': noticeHandler
};

const initializeApp = async () => {
    try {
        dotenv.config();
        const bot = await Bot.getInstance();

        Environment.https = process.env.HTTPS === 'true';

        CommandExecutor.initialize();

        await Passport.setup();

        await TwitchAuthenticator.initialize();
        await Twitch.initialize();
        await Twitch.initializeLiveMonitor();

        GreetingsManager.initialize();


        for (const event of Object.keys(EventHandlers) as (keyof typeof EventHandlers)[]) {
            console.log(chalk.bgCyan.bold('[Bot EventHandlers]'), chalk.white(`Registering event handler for ${event}`));
            bot.getBotClient().on(event, EventHandlers[event]);
        }

        try {
            await bot.getBotClient().connect();
        } catch (error) {
            console.warn(chalk.yellow('[APP ERROR]'), error);
        }
        
        await bot.joinInitialChannels();
        bot.getBotClient().join(bot.getBotClient().getUsername());  // Join the bot's own channel for self-user settings

        /* Twitch Events should be initialized before the web server */
        await TwitchEvents.setup();
        await WebServer.boot();

        console.log(chalk.bgCyan.bold('[APP]'), chalk.white('All services initialized.'));

    } catch (error) {
        console.error(chalk.red('[APP ERROR]'), error);
    }
}

initializeApp();