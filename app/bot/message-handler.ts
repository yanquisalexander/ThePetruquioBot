import chalk from "chalk";
import { ChatUserstate } from "tmi.js";
import ChatUser from "../../utils/chat-user";
import Channel from "../models/Channel.model";
import { Bot } from "../../bot";
import User from "../models/User.model";
import MessageLogger from "../models/MessageLogger.model";
import Environment from "../../utils/environment";
import CommandExecutor from "../../lib/CommandExecutor";
import GreetingsManager from "../modules/GreetingsManager.module";
import SpectatorLocation from "../models/SpectatorLocation.model";
import Twitch from "../modules/Twitch.module";
import { CountrieLocales } from "../constants/CountrieLocales.constants";
import Shoutout from "../models/Shoutout.model";
import RandomResponses from "../modules/RandomResponses.module";
import Workflow, { EventType } from "../models/Workflow.model";
import os from "os";

export const handleChatMessage = async (channel: string, userstate: ChatUserstate, message: string, self: boolean) => {
    const bot = await Bot.getInstance();
    const user = new ChatUser(userstate, message);
    if (self || user.username === bot.getBotClient().getUsername()) {
        /* Double check to avoid infinite loops (Maybe because running on multiple instances) */
        return;
    }
    const channelName = channel.replace('#', '');

    const channelData = await Channel.findByUsername(channelName);
    let userData = await User.findByTwitchId(user.id);

    if (!channelData) {
        console.error(chalk.red(`[ERROR]`), `Channel ${chalk.bold(channelName)} not found on database. To join a channel, use the command ${chalk.bold('!join')} on the bot's channel. Disconnecting from channel.`);
        (await Bot.getInstance()).getBotClient().part(channelName);
        return;
    }

    if (!userData) {
        console.warn(chalk.yellow(`[WARNING]`), `User ${chalk.bold(user.username)} not found on database. Creating user...`);

        /*
            PetruquioBot was created to be friendly with users and streamers.

            To achieve this, the bot will create a new user on the database if it doesn't exist
            to learn more about the user and interact with them in a more personal way on some features
            (For example, Assistant module), or for example in a loyalty system.

        */

        const twitchUser = await Twitch.Helix.users.getUserByName(user.username);


        try {
            const newUser = new User(user.username, user.id, undefined, user.displayName, twitchUser?.profilePictureUrl);
            await newUser.save();
            userData = newUser;
        } catch (error) {
            console.error(chalk.red(`[ERROR]`), `Error creating user ${chalk.bold(user.username)}: ${error}`);
            /* For security reasons, don't continue the execution of the handler if the user can't be created */
            return;
        }
    }

    if(userData.username !== user.username && userData.twitchId === user.id) {
        /* Update user's display name if it changed */
        userData.displayName = user.displayName;
        userData.username = user.username;
        console.warn(chalk.yellow(`[WARNING]`), `User ${chalk.bold(user.username)} changed their username or display name. Updating database...`);
        try {
            await userData.save();
            console.log(chalk.green(`[SUCCESS]`), `User ${chalk.bold(user.username)} updated successfully!`);
        } catch (error) {
            console.error(chalk.red(`[ERROR]`), `Error updating user ${chalk.bold(user.username)}: ${error}`);
            /* 
                Execution can continue because we use the id to identify the user
            */
        }
    }

    const userOnMap = await SpectatorLocation.findByUserId(userData.twitchId);


    /* If PetruquioBot is mentioned, show a random message (@petruquiobot) */
    if (message.toLowerCase().includes(`@${bot.getBotClient().getUsername().toLowerCase()}`)) {
        if (userData.username === 'tangerinebot_') return // TangerineBot causes infinite loops
        if(message.toLowerCase().includes('are you alive') && user.isBotOwner) {
            return bot.sendMessage(channelData, `@${user.displayName}, looks like I'm alive! Running on ${Environment.isDevelopment ? 'development' : 'production'} mode (On ${os.hostname()})`);
        }

        return bot.sendMessage(channelData, RandomResponses.processRandomResponse(message.toLowerCase(), userstate, channelData, bot));
    }



    try {
        if (userData) {
            await MessageLogger.logMessage({
                channel: channelData,
                sender: userData,
                content: message,
                timestamp: new Date()
            });
        }
    } catch (error) {
        /* Ignore because this isn't important */
    }

    if (Environment.isDevelopment) {
        console.log(chalk.yellow(`[${channelName}]`), `${chalk.hex(user.color).bold(user.displayName)}: ${message}`);
    }

    if (channelData.preferences.enableGreetings && channelData.preferences.enableGreetings.value) {

        /* Bots can't register on Community Map, so we pass true to isUserOnMap */

        if (await GreetingsManager.canReceiveGreeting(channelData, userData, user.isBot ? true : userOnMap)) {
            console.log(chalk.yellow(`[GREETINGS]`), `${chalk.hex(user.color).bold(user.displayName)} is eligible for a greeting!`);
            let greeting = '';
            type CountryCode = keyof typeof CountrieLocales;
            let lang = 'en'; // TODO: Lookup for user language based on country code

            if (userOnMap && userOnMap instanceof SpectatorLocation) {
                if (userOnMap.countryCode && userOnMap.countryCode in CountrieLocales) {
                    lang = CountrieLocales[userOnMap.countryCode as CountryCode] || 'en';
                }
            }

            if (user.isBroadcaster) {
                greeting = GreetingsManager.getRandomBroadcasterGreeting(user.displayName);
            } else {
                greeting = await GreetingsManager.getRandomGreeting(user.displayName, user.isBot, lang, userData.isBirthdayToday());
            }

            GreetingsManager.addToGreetingStack(channelData, greeting);
        }

        if (await GreetingsManager.canReceiveShoutoutGreeting(channelData, userData)) {
            const greeting = await Shoutout.find(channelData, userData)
            console.log(greeting)
            if (greeting) {
                console.log(chalk.yellow(`[GREETINGS]`), `${chalk.hex(user.color).bold(user.displayName)} is eligible for a shoutout greeting!`);
                GreetingsManager.addToGreetingStack(channelData, greeting.messages[Math.floor(Math.random() * greeting.messages.length)]);
                try {
                    let helixUser = await userData.fromHelix();
                    if (!helixUser) {
                        return;
                    }
                    await Twitch.shoutout(channelData, helixUser)
                } catch (error) {
                    console.error(chalk.red(`[ERROR]`), `Error shouting out ${chalk.bold(user.username)}: ${error}`);
                }
            }
        }
    }

    try {
        const workflow = await Workflow.find(channelData, EventType.OnChatMessage);
        if (workflow) {
            workflow.execute({
                channel: channelData,
                user: userData,
                message: message,
                isCommand: message ? message.startsWith('!') : false,
                isBot: user.isBot,
                command: message ? message.split(' ')[0].replace('!', '') : '',
            });
        }
    } catch (error) {
        console.error(chalk.red(`[ERROR]`), `Error executing workflow for channel ${chalk.bold(channelData.user.displayName)}: ${error}`);
    }



    if (message.startsWith('!')) {
        const command = message.split(' ')[0].replace('!', '');
        const args = message.split(' ').slice(1);

        const response = await CommandExecutor.getInstance().executeCommand(user, command, args, channelData, bot);
        if (response) {
            bot.sendMessage(channelData, response);
        }
    }


}