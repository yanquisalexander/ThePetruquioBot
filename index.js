import dotenv from 'dotenv';
import './lib/twitch-auth.js';
import chalk from 'chalk';
import { Bot, KickBot, sendMessage } from './bot.js';
import Channel from './app/models/Channel.js';
import {
    getRandomGreeting,
    canReceiveGreeting,
    addGreetingToStack,
} from './modules/greetings.js';
import {
    activeUsers,
    greetingsStack,
    autoTranslateUsers,
} from './memory_variables.js';
import {
    getRandomBotResponse,
    getRandomOnClearChat,
} from './modules/random-responses.js';
import { handleCommand } from './modules/commands.js';
import { getChannelInfo, knownBots } from './utils/twitch.js';
import { translate } from './modules/translate.js';
import { railwayConnected } from './utils/environment.js';
import { WebServer } from './server/boot-webserver.js';
import BotModel from './app/models/Bot.js';

try {
    dotenv.config();
    console.log(chalk.blue('Environment variables loaded'));
} catch (error) {
    console.error(chalk.bgBlack.red('Missing .env file'));
    process.exit(-1);
}


if (!process.env.BOT_NAME || !process.env.BOT_PASSWORD) {
    console.error(chalk.bgBlack.red('Missing BOT_NAME or BOT_PASSWORD in .env file'));
    process.exit(-1);
}

if (!railwayConnected) {
    console.error(chalk.yellow('Missing RAILWAY_API_KEY in .env file. You cannot use !restart command'));
}

await WebServer.boot();




Bot.connect()
    .then(() => {
        Bot.join(process.env.BOT_NAME);
    })
    .catch(console.error);

const onConnectedHandler = (address, port) => {
    console.log(chalk.bgWhite.magenta.bold(`Connected to Twitch as ${Bot.getUsername()} (${address}:${port})`));
};

const processMessage = async ({ channel, context, username, message }) => {
    const isModerator = context.mod || Boolean(context.badges?.broadcaster);
    const isBroadcaster = isModerator && context.badges.broadcaster;
    channel = channel.slice(1);

    const channelData = await Channel.getChannelByName(channel.replace('#', ''));
    const twitchChannelInfo = await getChannelInfo(channel.replace('#', ''));
    const settings = channelData?.settings || {};
    console.log(settings)
    const greetingsEnabled = settings?.greetings?.enabled || false;

    //TODO: Ban compartido 
    //console.log(await Channel.checkSharedBans(username))


    if (!activeUsers[channel]) {
        activeUsers[channel] = {};
    }

    if (!autoTranslateUsers[channel]) {
        autoTranslateUsers[channel] = {};
    }

    if (autoTranslateUsers[channel][username]) {
        const translatedMessage = await translate(message, 'en', username);
        sendMessage(channel, translatedMessage);
        return;
    }

    if (message.toLowerCase().includes(`@${Bot.getUsername().toLowerCase()}`)) {
        return sendMessage(channel, `@${username}, ${getRandomBotResponse()}`);
    }


    if (greetingsEnabled) {
        if (canReceiveGreeting(channel, username, channel.replace('#', ''))) {
            activeUsers[channel][username] = Date.now();
            const isBot = knownBots.includes(username.toLowerCase());
            const greetingMessage = getRandomGreeting(username, isBot);
            addGreetingToStack(channel, greetingMessage);
        }

    }
    else {
        console.log(chalk.bgWhite.magenta.bold(`Greetings are disabled in ${channel}`));
    }
    const isCommand = message.startsWith('!');
    if (isCommand) {
        const args = message.slice(1).split(' ');
        await handleCommand({ channel, context, username, message, toUser: args[1] });
    }
};



const onMessageHandler = (channel, context, message, self) => {
    if (context.username === Bot.getUsername() || self) return;
    processMessage({ channel, context, username: context.username, message });
};

const onChatClearedHandler = (channel) => {
    console.log(chalk.bgWhite.magenta.bold(`Chat has been cleared in ${channel}`));
    //Bot.say(channel, getRandomOnClearChat());
};

const onWhisperHandler = (from, context, message, self) => {
    console.log(chalk.bgWhite.blue.bold(`Whisper received from ${from}: ${message}`));
};

const onNoticeHandler = async (channel, msgid, message) => {
    try {
        console.log('>>>>', 'NOTICE', channel, msgid, message);
        if (msgid === 'msg_banned') {
            const chan = channel.toLowerCase().substring(1);
            let channelData = await getChannelInfo(chan);
            await BotModel.addBan(channelData.id)
            console.log(`Bot has been banned on ${chan} channel :(`);
            
        }
    } catch (e) {
        console.error(e);
    }
};

const onRaidedHandler = async (channel, username, viewers) => {
    console.log(channel, username, viewers);
    const raiderData = await Channel.getChannelByName(username);
    const targetChannel = await Channel.getChannelByName(channel.replace('#', ''));

    if (!raiderData) {
        // No specific raider data found, send a generic raid message
        return Bot.say(channel, `@${username} has raided with ${viewers} viewers! PogChamp`);
    }

    const { shoutOutPresentation } = raiderData.settings;
    const { autoShoutOut } = targetChannel.settings;

    if (shoutOutPresentation) {
        if (autoShoutOut.enabled) {
            let message = shoutOutPresentation.replace('${username}', username).replace('${viewers}', viewers);

            if (!Bot.isMod(channel, Bot.getUsername())) {
                // Remove links from the shoutout message
                message = message.replace(/https?:\/\/\S+/g, '');
            }

            return Bot.say(channel, message);
        }
    }
};


// Cada 10 segundos, verificar si hay alguien a quien saludar
setInterval(() => {
    try {
        if (greetingsStack.length > 0) {
            const greeting = greetingsStack.shift();
            // Realizar la acción correspondiente para saludar, por ejemplo, enviar un mensaje
            sendMessage(greeting.channel, greeting.message);
        }
    } catch (e) {
        console.error(e.stack);
    }
}, 10 * 1000);

Bot.on('connected', onConnectedHandler);
Bot.on('chat', onMessageHandler);
Bot.on('clearchat', onChatClearedHandler);
Bot.on('whisper', onWhisperHandler);
Bot.on('notice', onNoticeHandler);
Bot.on('join', (channel, username, self) => {
    if (self) {
        console.log(chalk.yellow.bold(`Joined ${channel}`));
    }
});
//Bot.on('raided', onRaidedHandler)