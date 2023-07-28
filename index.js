import chalk from 'chalk';
import dotenv from 'dotenv';
import BotModel from './app/models/Bot.js';
import Channel from './app/models/Channel.js';
import SpectatorLocation from './app/models/SpectatorLocation.js';
import { Bot, sendMessage } from './bot.js';
import './lib/twitch-auth.js';
import {
    CountryLangs,
    activeUsers,
    autoTranslateUsers,
    botJoinedChannels,
    greetingsStack,
    suspendedChannels,
    whisperedUsers,
} from './memory_variables.js';
import { handleCommand } from './modules/commands.js';
import { handleDetoxify } from './modules/detoxify.js';
import {
    addGreetingToStack,
    canReceiveGreeting,
    getRandomGreeting,
} from './modules/greetings.js';
import { getRandomBotResponse } from './modules/random-responses.js';
import { translate } from './modules/translate.js';
import { WebServer } from './server/boot-webserver.js';
import { railwayConnected } from './utils/environment.js';
import { HelixClient, getChannelInfo, knownBots } from './utils/twitch.js';





// Monkey patching console.log to add timestamp to logs
const originalLog = console.log;
console.log = (...args) => {
    originalLog(`[${new Date().toLocaleString()}]`, ...args);
};

// Clear console on start to avoid clutter from previous sessions (in production mode) 
console.clear();

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
        if (process.env.NODE_ENV === 'production') {
            // On production, join to self channel
            Bot.join(process.env.BOT_NAME);
        }
    })
    .catch(console.error);

const onConnectedHandler = (address, port) => {
    console.log(chalk.bgWhite.magenta.bold(`Connected to Twitch as ${Bot.getUsername()} (${address}:${port})`));
};

const processMessage = async ({ channel, context, username, message }) => {
    const isModerator = context.mod || Boolean(context.badges?.broadcaster) || context.username === 'alexitoo_uy' // Bot owner;
    const isBroadcaster = isModerator && context.badges.broadcaster;
    const isBot = knownBots.includes(username.toLowerCase());
    const userOnMap = await SpectatorLocation.find(username);
    channel = channel.replace('#', '');

    const channelData = await Channel.getChannelByName(channel.replace('#', ''));
    const twitchChannelInfo = await getChannelInfo(channel.replace('#', ''));
    const settings = channelData.settings || {};
    let Settings = {};

    Object.entries(settings).reduce((acc, [key, setting]) => {
        acc[key] = setting.value;
        return acc;
    }, Settings);

    //TODO: Ban compartido 
    //console.log(await Channel.checkSharedBans(username))


    if (!activeUsers[channel]) {
        activeUsers[channel] = {};
    }

    if (!autoTranslateUsers[channel]) {
        autoTranslateUsers[channel] = {};
    }
    if (Settings.bot_muted && !isModerator) {
        console.log(chalk.yellow.bold(`Bot is muted in ${channel} :(`));
        return;
    }

    if (autoTranslateUsers[channel][username]) {
        const translatedMessage = await translate(message, 'en', username);
        sendMessage(channel, translatedMessage);
        return;
    }

    if (message.toLowerCase().includes(`@${Bot.getUsername().toLowerCase()}`)) {
        return sendMessage(channel, `@${username}, ${getRandomBotResponse()}`);
    }


    if (Settings.enable_greetings) {
        if (Settings.bot_muted) return; // Don't greet if bot is muted
        if (await canReceiveGreeting(channel, username, channel, userOnMap)) {
            activeUsers[channel][username] = Date.now();
            console.log(userOnMap)
            let lang = 'en'
            if (userOnMap && userOnMap.country_code && CountryLangs[userOnMap.country_code]) {
                lang = CountryLangs[userOnMap.country_code];
            }
            const greetingMessage = getRandomGreeting(username, isBot, lang);
            addGreetingToStack(channel, greetingMessage);
        }

    }
    const isCommand = message.startsWith('!');
    if (isCommand) {
        const args = message.slice(1).split(' ');
        await handleCommand({ channel, context, username, message, toUser: args[1], isModerator, settings: Settings });
    }

    if (Settings.enable_detoxify && !isModerator) {
        await handleDetoxify(channel, context, message, Settings);
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

const onWhisperHandler = async (from, context, message, self) => {
    console.log(chalk.bgWhite.blue.bold(`Whisper received from ${from}: ${message}`));
    if (whisperedUsers[from] && Date.now() - whisperedUsers[from] < 1000 * 60 * 60 * 24) return; // Don't answer if whispered in the last 24 hours
    if (self) return;
    whisperedUsers[from] = Date.now();

    const toUser = await getChannelInfo(from.replace('#', ''));
    await HelixClient.whispers.sendWhisper(process.env.TWITCH_USER_ID, toUser.id, `Hello ${context['display-name']}, I'm a bot created by Alexitoo_UY!`);
    setTimeout(() => {
        HelixClient.whispers.sendWhisper(process.env.TWITCH_USER_ID, toUser.id, `¿Want to know more about me? Type !help in my channel! GlitchCat `);
    }, 2000)
    setTimeout(() => {
        HelixClient.whispers.sendWhisper(process.env.TWITCH_USER_ID, toUser.id, `Need to change my settings? VoHiYo Go to https://petruquio.live/dashboard `);
    }, 4000)
    setTimeout(() => {
        HelixClient.whispers.sendWhisper(process.env.TWITCH_USER_ID, toUser.id, `Thanks for using me! <3`);
    }, 6000)
};

const onNoticeHandler = async (channel, msgid, message) => {
    console.log('>>>>', 'NOTICE', channel, msgid, message);
    try {
        if (msgid === 'msg_banned') {
            const chan = channel.toLowerCase().substring(1);
            let channelData = await getChannelInfo(chan);
            await BotModel.addBan(channelData.id)
            console.log(`Bot has been banned on ${chan} channel :(`);
            Bot.part(channel);
            console.log(`Bot has left ${chan} channel`);
        }
        if (msgid === 'msg_channel_suspended') {
            // Se añade el canal a la lista de canales suspendidos, y se intentará reconectar en 5 minutos
            // Si el canal sigue suspendido, se volverá a intentar en 2 minutos
            // Si tras 3 intentos el canal sigue suspendido, se eliminará de autojoin
            console.log(`Channel ${channel} has been suspended :(`);
            if (!suspendedChannels[channel]) {
                suspendedChannels[channel] = {
                    suspendedAt: Date.now(),
                    attempts: 0
                }
            }
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

// Cada 30 segundos, verificar si hay canales suspendidos que se puedan reconectar
setInterval(async () => {
    try {
        if (suspendedChannels.length > 0) {
            const channel = suspendedChannels[0];
            const { attempts, suspendedAt } = channel;

            if (attempts < 3 && Date.now() - suspendedAt > 2 * 60 * 1000) {
                console.log(`Retrying to join ${channel}...`);
                Bot.join(channel);

                // Incrementar intentos y actualizar tiempo de suspensión
                channel.attempts++;
                channel.suspendedAt = Date.now();

                // Mover el canal al final de la lista para dar paso a los siguientes canales
                suspendedChannels.splice(0, 1);
                suspendedChannels.push(channel);
            } else if (attempts >= 3) {
                console.log(`Retried to join ${channel} 3 times without success, removing from autojoin...`);
                let channelData = await Channel.getChannelByName(channel.replace('#', ''));
                await channelData.disableAutoConnect();

                // Eliminar el canal de la lista de canales suspendidos
                suspendedChannels.splice(0, 1);
            }
        }
    } catch (e) {
        console.error(e.stack);
    }
}, 30 * 1000);






Bot.on('connected', onConnectedHandler);
Bot.on('chat', onMessageHandler);
Bot.on('disconnected', (reason) => {
    console.log(chalk.bgWhite.magenta.bold(`Disconnected from Twitch: ${reason}`));
})
Bot.on('clearchat', onChatClearedHandler);
Bot.on('whisper', onWhisperHandler);
Bot.on('notice', onNoticeHandler);
Bot.on('join', (channel, username, self) => {
    if (self) {
        botJoinedChannels[channel] = {
            joinedAt: Date.now()
        };
        console.log(chalk.green.bold(`Joined ${channel}`));
    }
});

//Bot.on('raided', onRaidedHandler)
