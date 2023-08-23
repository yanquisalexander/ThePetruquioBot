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
    latencyInfo,
    liveChannels,
    shoutoutedUsers,
    userLocationQueue
} from './memory_variables.js';
import { handleCommand } from './modules/commands.js';
import { handleDetoxify } from './modules/detoxify.js';
import {
    addGreetingToStack,
    canReceiveGreeting,
    canReceiveShoutoutGreeting,
    getRandomBroadcasterGreeting,
    getRandomGreeting,
} from './modules/greetings.js';
import { getRandomBotResponse } from './modules/random-responses.js';
import { translate } from './modules/translate.js';
import { WebServer } from './server/boot-webserver.js';
import { railwayConnected } from './utils/environment.js';
import { HelixClient, checkLiveChannels, getChannelInfo, getLiveChannels, isChannelLive, knownBots } from './utils/twitch.js';
import Shoutout from './app/models/Shoutout.js';
import { redis } from './lib/redis.js';


// Monkey patching console.log to add timestamp to logs
const originalLog = console.log;
console.log = (...args) => {
    originalLog(`[${new Date().toLocaleString()}]`, ...args);
};

// Clear console on start to avoid clutter from previous sessions (in production mode) 
console.clear();

// Para instanceId, se utiliza el nombre del bot, más un número aleatorio entre 1 y 1000 (aunque cambie cada vez que se reinicie el bot)
export const instanceId = `petruquiobot-${Math.floor(Math.random() * 1000) + 1}`;

try {
    dotenv.config();
    console.log(chalk.blue('Environment variables loaded'));
    console.log(chalk.blue('NODE_ENV:', process.env.NODE_ENV));
    console.log(chalk.blue('Instance ID:', instanceId));
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

const bootServer = async () => {
    await WebServer.boot();
};

bootServer();



Bot.connect()
    .then(() => {
        Bot.join(process.env.BOT_NAME);
        if (process.env.NODE_ENV === 'production') {
            // On production, join to self channel
            Bot.join(process.env.BOT_NAME);
        }
    }).catch(console.error);

const onConnectedHandler = (address, port) => {
    console.log(chalk.bgWhite.magenta.bold(`Connected to Twitch as ${Bot.getUsername()} (${address}:${port})`));
};

const processMessage = async ({ channel, context, username, message }) => {
    const isModerator = context.mod || Boolean(context.badges?.broadcaster) || context.username === 'alexitoo_uy' // Bot owner;
    const isBroadcaster = isModerator && context.badges.broadcaster;
    const isBot = knownBots.includes(username.toLowerCase());
    let userOnMap = null;
    try {
        userOnMap = await SpectatorLocation.find(username);
    } catch (error) {
        console.error(error);
    }
    channel = channel.replace('#', '');
    username = username.replace('@', '');
    const displayName = context['display-name'] || username;

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

    if (!shoutoutedUsers[channel]) {
        shoutoutedUsers[channel] = {};
    }

    if (!autoTranslateUsers[channel]) {
        autoTranslateUsers[channel] = {};
    }
    if (Settings.bot_muted && !isModerator) {
        console.log(chalk.yellow.bold(`Bot is muted in ${channel} :(`));
        return;
    }

    if (Settings.enable_greetings) {
        if (Settings.bot_muted) return; // Don't greet if bot is muted

        if (!userOnMap && username === channel) // Greet the streamer always, even if not on map
        {
            userOnMap = true;
        }
        if (await canReceiveGreeting(channel, username, channel, userOnMap)) {
            let lang = 'en'
            if (userOnMap && userOnMap.countryCode && CountryLangs[userOnMap.countryCode]) {
                lang = CountryLangs[userOnMap.countryCode]

            }
            let greetingMessage = await getRandomGreeting(displayName, isBot, lang);
            if (isBroadcaster) {
                greetingMessage = getRandomBroadcasterGreeting(displayName);
            }
            addGreetingToStack(channel, greetingMessage);
        }

    }

    if (Settings.enable_community_features && Settings.enable_auto_shoutout) {
        try {
            let shoutout = await Shoutout.findByTargetStreamer(channelData.id, username);
            if (shoutout && shoutout.enabled) {
                if (await canReceiveShoutoutGreeting(channel, username)) {
                    addGreetingToStack(channel, shoutout.message);
                    try {
                        const nativeShoutout = await HelixClient.asUser(process.env.TWITCH_USER_ID, (async client => {
                            let targetChannel = await client.users.getUserByName(username);
                            let shoutout = await client.chat.shoutoutUser(channelData.twitch_id, targetChannel.id, process.env.TWITCH_USER_ID);
                            return shoutout;
                        }))
                    } catch (error) {
                        console.error(error)
                    }
                }


            }
        } catch (error) {

        }
    }


    if (autoTranslateUsers[channel][username]) {
        const translatedMessage = await translate(message, 'en', username, settings);
        sendMessage(channel, translatedMessage);
        return;
    }

    if (message.toLowerCase().includes(`@${Bot.getUsername().toLowerCase()}`)) {
        if (username === 'tangerinebot_') return // TangerineBot can cause infinite loop
        return sendMessage(channel, `@${username}, ${getRandomBotResponse()}`);
    }


    
    const isCommand = message.startsWith('!');
    if (isCommand) {
        const args = message.slice(1).split(' ');
        await handleCommand({ channel, context, username, message, toUser: args[1], isModerator, settings: Settings, channelData });
    }

    if (Settings.enable_detoxify && !isModerator) {
        await handleDetoxify(channel, context, message, Settings);
    }
};



const onMessageHandler = async (channel, context, message, self) => {
    var nextInstance = await getNextInstance();
    if (process.env.NODE_ENV !== 'production') {
        nextInstance = instanceId; // For development, always process messages on the same instance
        //console.log(chalk.bgWhite.green.bold(`Development mode: Processing all messages on instance ${nextInstance}`));
    }

    if (context.username === Bot.getUsername() || self || instanceId !== nextInstance) {
        // Ignorar mensajes si no es la instancia que debe procesarlos
        return;
    }

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
            if (!suspendedChannels.find(c => c.channel === channel)) {
                suspendedChannels.push({
                    channel: channel.replace('#', ''),
                    suspendedAt: Date.now(),
                    attempts: 0
                })
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


// Cada 2 minutos, verificamos si los canales están en vivo
setInterval(async () => {
    await checkLiveChannels();
}, 2 * 60 * 1000);


// Pasados 15 segundos de que el bot se conecte, obtener los canales en vivo, luego, utilizará el intervalo

setTimeout(async () => {
    await checkLiveChannels();
}, 15 * 1000);

setInterval(async () => {
    try {
        if (userLocationQueue.length > 0) {
            const user = userLocationQueue.shift();
            const spectatorLocation = await SpectatorLocation.find(user.username);
            if (spectatorLocation) {
                await spectatorLocation.getGeocode();
                await spectatorLocation.save();
                console.log(chalk.bgWhite.blue.bold(`SPECTATOR LOCATION: Spectator location for ${user.username} has been updated`));
            }
            delete userLocationQueue[user.username];
        }
    } catch (error) {
        console.error(error);
        // Add again to the queue
        userLocationQueue.push(user);
    }
}, 5 * 10000);








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
    Bot.on('pong', (latency) => {
        latencyInfo.lastLatency = latency;
    })

    //Bot.on('raided', onRaidedHandler)



    // Registro de la instancia en Redis al iniciarse
    async function registerInstance() {
        try {
            const timestamp = Date.now();
            await redis.zadd('active_instances', timestamp, instanceId);
            console.log(chalk.bgWhite.magenta.bold(`Instance ${instanceId} registered in Redis with timestamp ${timestamp}`));
        } catch (error) {
            console.error('Error registering instance:', error);
        }
    }


    // Obtener la siguiente instancia con el timestamp más bajo
    async function getNextInstance() {
        try {
            const allInstances = await redis.zrange('active_instances', 0, -1, 'WITHSCORES');

            if (allInstances.length === 0) {
                console.log('No active instances found.');
                return null;
            }

            // Filtrar las instancias y puntuaciones (timestamps) del conjunto ordenado
            const instanceIds = allInstances.filter((_, index) => index % 2 === 0);
            const instanceScores = allInstances.filter((_, index) => index % 2 !== 0).map(Number);

            // Encontrar la instancia con el timestamp más bajo
            const minTimestamp = Math.min(...instanceScores);
            const minTimestampIndex = instanceScores.indexOf(minTimestamp);
            const nextInstanceId = instanceIds[minTimestampIndex];

            return nextInstanceId;
        } catch (error) {
            console.error('Error getting next instance:', error);
            return null;
        }
    }






    // Registrar la instancia en Redis al iniciarse (solo en producción)
    if (process.env.NODE_ENV === 'production') {
        registerInstance();
    }

    // Enviar un heartbeat a Redis

    async function sendHeartbeat() {
        try {
            // Utiliza el comando hmset para agregar el campo con la marca de tiempo actual
            await redis.zadd('active_instances', Date.now(), instanceId);
        } catch (error) {
            console.error('Error enviando el heartbeat:', error);
        }
    }

    if (process.env.NODE_ENV === 'production') {
        // Temporizador para enviar señales "heartbeat" cada 30 segundos
        setInterval(sendHeartbeat, 30 * 1000);
    }

    // Verificar y eliminar instancias desconectadas
    async function checkAndRemoveDisconnectedInstances() {
        try {
            // Obtén todas las instancias activas y sus marcas de tiempo de "heartbeat" del conjunto ordenado
            const activeInstances = await redis.zrange('active_instances', 0, -1, 'WITHSCORES');
            const currentTime = Date.now();

            // Filtrar las instancias con marcas de tiempo más antiguas que un umbral (por ejemplo, 1 minuto)
            const disconnectedInstances = activeInstances.filter((_, index) => index % 2 === 0)
                .filter((instanceId, index) => currentTime - parseInt(activeInstances[index * 2 + 1]) > 60 * 1000);

            // Eliminar las instancias desconectadas del conjunto ordenado
            if (disconnectedInstances.length > 0) {
                await redis.zrem('active_instances', ...disconnectedInstances);
                console.log(chalk.bgWhite.magenta.bold(`Instancias desconectadas:`, disconnectedInstances));
                // No es necesario eliminar las claves directamente de Redis, ya que ya lo hicimos con zrem
            }
        } catch (error) {
            console.error('Error verificando y eliminando instancias desconectadas:', error);
        }
    }


    // Temporizador para verificar y eliminar instancias desconectadas cada 6 segundos, esto dará un margen de 1 minuto para que las instancias se reconecten
    setInterval(checkAndRemoveDisconnectedInstances, 0.20 * 60 * 1000);

    checkAndRemoveDisconnectedInstances(); // Ejecutar inmediatamente al iniciar el bot, para eliminar instancias desconectadas de sesiones anteriores