import { Bot, sendMessage } from "../bot.js";
import { autoTranslateUsers } from "../memory_variables.js";
import { getRandomFact } from "./random-responses.js";
import { langExpl, langList, translate } from "./translate.js";
import { replaceVariables } from "../utils/variable-replacement.js";
import SpectatorLocation from "../app/models/SpectatorLocation.js";
import WorldMap from "../app/models/WorldMap.js";
import Channel, { SETTINGS_MODEL } from "../app/models/Channel.js";
import { HelixClient, getChannelInfo } from "../utils/twitch.js";


export const handleCommand = async ({ channel, context, username, message, toUser }) => {
    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    switch (command) {
        case 'chao':
            return sendMessage(channel, `Chao, @${username}!`);
        case 'whoami':
            return sendMessage(channel, `Eres ${username}!`);
        case 'comandos':
            return sendMessage(channel, `!hola, !chao, !bot, !so, !discord, !twitter, !instagram, !youtube, !donar, !comandos`);
        case 'lang':
            return sendMessage(channel, langExpl[Math.floor(Math.random() * langExpl.length)]);
        case 'random':
            return sendMessage(channel, `@${username}, ${getRandomFact()}`);
        case 'autotranslate':
            const user = args[0].toLowerCase();
            if (user) {
                autoTranslateUsers[channel][user] = true;
                setTimeout(() => {
                    delete autoTranslateUsers[channel][user];
                }, 5 * 60 * 1000); // 5 minutos
                sendMessage(channel, `Los mensajes de @${user} serán traducidos automáticamente al idioma del canal durante los próximos 5 minutos.`);
            } else {
                sendMessage(channel, `Debes especificar un nombre de usuario después del comando !autotranslate.`);
            }
            return;
        case 'from':
            const location = args.join(' ');
            if (location) {
                const spectatorLocation = new SpectatorLocation(username, location);
                await spectatorLocation.getGeocode();
                await spectatorLocation.save();
                sendMessage(channel, `Tu ubicación ha sido registrada correctamente.`);
            } else {
                sendMessage(channel, `Debes especificar una ubicación después del comando !from.`);
            }
            return;
        case 'msg':
            const messageContent = args.join(' ');
            if (messageContent) {
                if(messageContent.length > 100) {
                    return sendMessage(channel, `@${username}, el mensaje no puede ser mayor a 100 caracteres.`);
                }
                const worldMap = new WorldMap(username, channel.replace('#', ''), true, null, messageContent);
                await worldMap.save();
                sendMessage(channel, `Tu mensaje personalizado ha sido guardado.`);
            } else {
                sendMessage(channel, `Debes especificar un mensaje después del comando !msg.`);
            }
            return;
        case 'show':
            const showMap = new WorldMap(username, channel.replace('#', ''), true);
            await showMap.save();
            sendMessage(channel, `${username}, listo, tu ubicación será mostrada en el mapa :) !`);
            return;
        case 'hide':
            const hideMap = new WorldMap(username, channel.replace('#', ''), false);
            await hideMap.save();
            sendMessage(channel, `${username}, listo, tu ubicación ya no será mostrada en el mapa! :(`);
            return;
        case 'emote':
            const pinEmote = args[0];
            if (pinEmote) {
                let emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v1/${Object.keys(context.emotes)[0]}/2.0`
                const emoteMap = new WorldMap(username, channel.replace('#', ''), true, emoteUrl);
                await emoteMap.save();
                sendMessage(channel, `@${username}, tu Pin se ha sido guardado correctamente.`);
            } else {
                sendMessage(channel, `@${username}, Debes especificar un emote después del comando !emote.`);
            }
            return;
        case 'join':
            if (channel === Bot.getUsername()) {
                let joinChannel = username; // Por defecto, unirse al canal actual
                if (username === 'alexitoo_uy') {
                    if (args.length > 0) {
                        joinChannel = args[0].toLowerCase(); // Si el usuario es "alexitoo_uy", se acepta el parámetro como nombre de canal
                    } else {
                        return sendMessage(channel, `¡Debes especificar un canal después del comando !join!`);
                    }
                }

                let channelInfo = await getChannelInfo(joinChannel)
                try {
                    await Channel.addChannel({
                        name: joinChannel,
                        team_id: null,
                        twitch_id: channelInfo.id,
                        settings: { ...SETTINGS_MODEL },
                        auto_connect: true
                    })

                    Bot.join(joinChannel)

                } catch (error) {
                    return sendMessage(channel, `¡El bot no se ha podido unir al canal de @${joinChannel}! - ${error.message}`);
                }

                return sendMessage(channel, `¡El bot se ha unido al canal de @${joinChannel} correctamente!`);
            }
            return;

        case 'map':
            return sendMessage(channel, `You can access our EarthDay map here: petruquio.live/map/${channel.replace('#', '')}`);
        default:
            if (langList.includes(command)) {
                let translated = await translate(message, command, username)
                sendMessage(channel, translated)
            }
            return;
    }
};
