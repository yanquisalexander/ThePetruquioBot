import dotenv from 'dotenv';
import chalk from 'chalk';
import { Bot } from './bot.js';
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
import { knownBots } from './utils/twitch.js';
import { translate } from './modules/translate.js';

dotenv.config();

if (!process.env.BOT_NAME || !process.env.BOT_PASSWORD) {
    console.error(chalk.bgBlack.red('Missing BOT_NAME or BOT_PASSWORD in .env file'));
    process.exit(-1);
}

Bot.connect()
    .then(() => {
        Bot.join(process.env.BOT_NAME);
    })
    .catch(console.error);

const onConnectedHandler = (address, port) => {
    console.log(chalk.bgWhite.magenta.bold(`Connected to Twitch as ${Bot.getUsername()}`));
};

const processMessage = async ({ channel, context, username, message }) => {
    const isModerator = context.mod || Boolean(context.badges?.broadcaster);
    const isBroadcaster = isModerator && context.badges.broadcaster;

    if (!activeUsers[channel]) {
        activeUsers[channel] = {};
    }

    if (autoTranslateUsers[username]) {
        const translatedMessage = await translate(message, 'en', username);
        sendMessage(channel, translatedMessage);
        return;
    }

    if (message.toLowerCase().includes(`@${Bot.getUsername().toLowerCase()}`)) {
        return Bot.say(channel, `@${username}, ${getRandomBotResponse()}`);
    }

    if (canReceiveGreeting(channel, username, channel.replace('#', ''))) {
        activeUsers[channel][username] = Date.now();
        const isBot = knownBots.includes(username.toLowerCase());
        const greetingMessage = getRandomGreeting(username, isBot);
        return addGreetingToStack(channel, greetingMessage);
    }

    const isCommand = message.startsWith('!');
    if (isCommand) {
        const args = message.slice(1).split(' ');
        await handleCommand({ channel, context, username, message, toUser: args[1] });
    }
};

const sendMessage = (channel, message) => {
    Bot.say(channel, message);
};

const onMessageHandler = (channel, context, message, self) => {
    if (context.username === Bot.getUsername() || self) return;
    processMessage({ channel, context, username: context.username, message });
};

const onChatClearedHandler = (channel) => {
    console.log(chalk.bgWhite.magenta.bold(`Chat has been cleared in ${channel}`));
    Bot.say(channel, getRandomOnClearChat());
};

const onWhisperHandler = (from, context, message, self) => {
    console.log(chalk.bgWhite.blue.bold(`Whisper received from ${from}: ${message}`));
};

const onNoticeHandler = (channel, msgid, message) => {
    try {
        console.log('>>>>', 'NOTICE', channel, msgid, message);
        if (msgid === 'msg_banned') {
            const chan = channel.toLowerCase().substring(1);
            console.log(`Bot has been banned on ${chan} channel :(`);
        }
    } catch (e) {
        console.error(e);
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
