import { Bot, sendMessage } from "../bot.js";
import { autoTranslateUsers, liveChannels } from "../memory_variables.js";
import { getRandomFact } from "./random-responses.js";
import { langExpl, langList, translate } from "./translate.js";
import { replaceVariables } from "../utils/variable-replacement.js";
import SpectatorLocation from "../app/models/SpectatorLocation.js";
import WorldMap from "../app/models/WorldMap.js";
import Channel, { SETTINGS_MODEL } from "../app/models/Channel.js";
import { AppClient, HelixClient, getChannelInfo, getLiveChannels } from "../utils/twitch.js";
import { channel } from "diagnostics_channel";
import { pusher } from "../lib/pusher.js";
import { WorldMapCache } from "../server/routes/world-map.js";
import Command from "../app/models/Command.js";
import Shoutout from "../app/models/Shoutout.js";
import Team from "../app/models/Team.js";
import { createAssistantResponse } from "./assistant.js";
import { addToAssistantHistory, clearAssistantHistory, isAssistantOnCooldown, setAssistantCooldown } from "../lib/assistant-tools.js";

const userCooldowns = {}; // Almacena los tiempos de cooldown por usuario y canal
const globalCooldowns = {}; // Almacena los tiempos de cooldown globales por canal

const formatSettingName = (setting) => {
    // Reemplazar guiones medios por guiones bajos
    let formattedName = setting.replace(/-/g, '_');

    // Convertir formato camelCase a formato con guiones bajos
    formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

    return formattedName;
};


const updateSetting = async (channel, setting, value, username) => {
    // Obtener el tipo de ajuste
    const settingType = SETTINGS_MODEL[setting].type;

    // Convertir el valor según el tipo de ajuste
    let parsedValue;
    if (settingType === 'boolean') {
        // Convertir valores booleanos alternativos a true o false
        if (value === 'on' || value === '1' || value === 'true') {
            parsedValue = true;
        } else if (value === 'off' || value === '0' || value === 'false') {
            parsedValue = false;
        } else {
            Bot.say(channel, `El valor ${value} no es válido para el ajuste ${setting}`);
            return;
        }
    } else if (settingType === 'string') {
        parsedValue = value; // Para ajustes de tipo string, no se requiere ninguna conversión
    }


    // Guardar los cambios en la base de datos
    try {
        const currentChannel = await Channel.getChannelByName(channel);
        if (currentChannel.settings.hasOwnProperty(setting) && typeof currentChannel.settings[setting] === 'object' && currentChannel.settings[setting].hasOwnProperty('value')) {
            currentChannel.settings[setting].value = parsedValue;
        }
        await currentChannel.updateSettings();
        await Channel.addAuditory(currentChannel.twitch_id, 'UPDATE_SETTING', {
            user: username,
            setting,
            value: parsedValue
        })
        pusher.trigger(`settings-${channel}`, 'update', {
            username,
            setting,
            value: parsedValue
        });
        if (setting === 'bot-muted' && value === true) return;
        Bot.say(channel, `El ajuste ${setting} ha sido actualizado ${settingType === 'boolean' ? 'a ' + parsedValue : '.'}`);
    } catch (error) {
        Bot.say(channel, `Ha ocurrido un error al intentar actualizar el ajuste ${setting}`);
        console.error(error);
    }
}



export const handleCommand = async ({ channel, context, username, message, toUser, isModerator, settings, channelData }) => {
    const args = message.slice(1).split(' ');
    let command = args.shift().toLowerCase();
    const isUserOnMap = await SpectatorLocation.find(username);

    let customCommand;
    try {
        customCommand = await Command.findByChannelAndName(channelData.id, command.toLowerCase());
    } catch (error) {
        //console.error(error.message);
    }


    if (command === 'ubica' || command === 'ubicacion' || command === 'ubicación') {
        command = 'from';
    }
    if (command === 'mostrar') {
        command = 'show';
    }
    if (command === 'ocultar') {
        command = 'hide';
    }

    switch (command) {
        case 'lang':
            if (!settings.enable_translation) return;

            return sendMessage(channel, langExpl[Math.floor(Math.random() * langExpl.length)]);
        case 'random':
            return sendMessage(channel, `@${username}, ${getRandomFact()}`);
        case 'autotranslate':
            if (!isModerator) return;
            if (!settings.enable_translation) {
                console.log(chalk.yellow.bold(`Translation is disabled in ${channel}`));
                return
            }
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
            if (!settings.enable_community_map) return;
            const location = args.join(' ');
            if (location) {
                const spectatorLocation = new SpectatorLocation(username, location);
                await spectatorLocation.getGeocode();
                await spectatorLocation.save();
                await pusher.trigger(`map-${channel}`, 'user-location', {
                    username,
                    locationName: spectatorLocation.location,
                    latitude: spectatorLocation.latitude,
                    longitude: spectatorLocation.longitude
                });
                WorldMapCache.clear(channel);
                sendMessage(channel, `Tu ubicación ha sido registrada correctamente.`);
            } else {
                sendMessage(channel, `Debes especificar una ubicación después del comando !from.`);
            }
            return;
        case 'msg':
            if (!settings.enable_community_map) return;
            if (!isUserOnMap) return sendMessage(channel, `@${username}, no tengo tu información registrada, usa el comando !from para registrarla GivePLZ`);
            const messageContent = args.join(' ');
            if (messageContent) {
                if (messageContent.length > 100) {
                    return sendMessage(channel, `@${username}, el mensaje no puede ser mayor a 100 caracteres.`);
                }
                const worldMap = new WorldMap(username, channel.replace('#', ''), true, null, messageContent);
                await worldMap.save();
                WorldMapCache.clear(channel);
                sendMessage(channel, `Tu mensaje personalizado ha sido guardado.`);
            } else {
                sendMessage(channel, `Debes especificar un mensaje después del comando !msg.`);
            }
            return;
        case 'show':
            if (!settings.enable_community_map) return;
            if (isUserOnMap) {
                const showMap = new WorldMap(username, channel.replace('#', ''), true);
                await showMap.save();
                WorldMapCache.clear(channel);
                sendMessage(channel, `${username}, listo, tu ubicación será mostrada en el mapa :) !`);
            } else {
                sendMessage(channel, `${username}, no tengo tu información registrada, usa el comando !from para registrarla GivePLZ`);
            }
            return;
        case 'hide':
            if (!settings.enable_community_map) return;
            if (!isUserOnMap) return sendMessage(channel, `@${username}, no tengo tu información registrada, usa el comando !from para registrarla GivePLZ`);
            const hideMap = new WorldMap(username, channel.replace('#', ''), false);
            await hideMap.save();
            sendMessage(channel, `${username}, listo, tu ubicación ya no será mostrada en el mapa! :(`);
            return;
        case 'emote':
            if (!settings.enable_community_map) return;
            if (!isUserOnMap) return sendMessage(channel, `@${username}, no tengo tu información registrada, usa el comando !from para registrarla GivePLZ`);
            const pinEmote = args[0];
            if (pinEmote) {
                let emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v1/${Object.keys(context.emotes)[0]}/2.0`
                const emoteMap = new WorldMap(username, channel.replace('#', ''), true, emoteUrl);
                await emoteMap.save();
                await pusher.trigger(`map-${channel}`, 'user-emote', {
                    username,
                    emote: emoteUrl
                });
                WorldMapCache.clear(channel);
                sendMessage(channel, `@${username}, tu Pin se ha sido guardado correctamente.`);
            } else {
                sendMessage(channel, `@${username}, Debes especificar un emote después del comando !emote.`);
            }
            return;
        case 'refreshmap':
            if (!settings.enable_community_map) return;
            if (!isModerator) return;
            // Buscar todos los usuarios en el mapa de la comunidad del canal, y actualizar los metadatos de cada usuario
            const usersOnMap = await WorldMap.getChannelMap(channel);
            console.log(`Se han encontrado ${usersOnMap.length} usuarios en el mapa de la comunidad. Intentando actualizar sus metadatos...`);
            let updatedCount = 0;
            try {
                usersOnMap.map(async (user) => {
                    let userLocation = await SpectatorLocation.find(user.username)
                    await userLocation.getGeocode();
                    await userLocation.save();
                    updatedCount++;
                    // Esperar 10 segundos entre cada actualización para evitar exceder el límite de la API de geocodificación
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                });
                sendMessage(channel, `Se han actualizado los metadatos de ${updatedCount} ${updatedCount.length > 1 ? 'usuarios' : 'usuario'} en el mapa de la comunidad.`);
                WorldMapCache.clear(channel);

            } catch (error) {
                console.error(error);
                sendMessage(channel, `Ha ocurrido un error al intentar actualizar los metadatos de los usuarios en el mapa de la comunidad.`);
            }

            break;

        case 'join':
            if (channel === Bot.getUsername()) {
                let joinChannel = username; // Por defecto, unirse al canal actual
                let autoJoin = true // Por defecto, unirse automáticamente al canal si el usuario es quien envió el comando, y si es "alexitoo_uy", tiene que especificar el parámetro "true" para unirse automáticamente
                if (username === 'alexitoo_uy') {
                    if (args.length > 0) {
                        joinChannel = args[0].toLowerCase(); // Si el usuario es "alexitoo_uy", se acepta el parámetro como nombre de canal
                        autoJoin = args[1] === 'true' ? true : false;
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
                        auto_connect: autoJoin // Por defecto, unirse automáticamente al canal si el usuario es quien envió el comando, y si es "alexitoo_uy", tiene que especificar el parámetro "true" para unirse automáticamente
                    })
                    if (process.env.NODE_ENV === 'production') {
                        Bot.join(joinChannel)
                    }

                } catch (error) {
                    return sendMessage(channel, `¡El bot no se ha podido unir al canal de @${joinChannel}! - ${error.message}`);
                }

                return sendMessage(channel, `¡El bot se ha unido al canal de @${joinChannel} correctamente!`);
            }
            return;

        case 'part':
            if (channel === Bot.getUsername()) {
                let partChannel = username; // Por defecto, salir del canal del usuario que envió el comando
                if (username === 'alexitoo_uy') {
                    if (args.length > 0) {
                        partChannel = args[0].toLowerCase(); // Si el usuario es "alexitoo_uy", se acepta el parámetro como nombre de canal
                        Bot.part(partChannel).then(async () => {
                            await Channel.deleteChannelByName(partChannel)
                            return sendMessage(channel, `¡El bot se ha desconectado del canal de @${partChannel} correctamente!`);
                        }).catch((error) => {
                            return sendMessage(channel, `¡El bot no se ha podido salir del canal de @${partChannel}! - ${error.message}`);
                        })

                    } else {
                        return sendMessage(channel, `¡Debes especificar un canal después del comando !part!`);
                    }
                }

                try {
                    Bot.part(partChannel).then(async () => {
                        await Channel.deleteChannelByName(partChannel)
                        return sendMessage(channel, `¡El bot se ha desconectado del canal de @${partChannel} correctamente!`);
                    }).catch((error) => {
                        return sendMessage(channel, `¡El bot no se ha podido salir del canal de @${partChannel}! - ${error.message}`);
                    })
                } catch (error) {
                    return sendMessage(channel, `¡El bot no se ha podido salir del canal de @${partChannel}! - ${error.message}`);
                }
            }
            return;
        case 'map':
            if (!settings.enable_community_map) return;
            // Si el comando es !map, y tiene una respuesta personalizada, enviar la respuesta personalizada
            if (customCommand && customCommand.response) {
                const parsedReply = await replaceVariables({
                    commandResponse: customCommand.response,
                    channel,
                    username,
                    toUser
                });
                return sendMessage(channel, parsedReply);
            }
            sendMessage(channel, `You can access our EarthDay map here: petruquio.live/c/${channel}/map`);
            break;
        case 'set':
            // Verificar si el usuario es un moderador
            if (!isModerator) {
                return;
            }

            // Verificar si se proporcionó un ajuste y un valor
            if (args.length < 2) {
                Bot.say(channel, `@${username}, Uso correcto: !set <ajuste> <valor>`);
                return;
            }

            // Obtener el ajuste y el valor del mensaje
            const setting = args[0];
            const value = args.slice(1).join(' ');

            // Verificar si el ajuste es válido según SETTINGS_MODEL en formato camelCase
            if (setting in SETTINGS_MODEL) {
                await updateSetting(channel, setting, value, username);
            }
            // Verificar si el ajuste es válido según SETTINGS_MODEL en formato con guiones medios
            else {
                const formattedSetting = formatSettingName(setting);
                if (formattedSetting in SETTINGS_MODEL) {
                    await updateSetting(channel, formattedSetting, value, username);
                } else {
                    Bot.say(channel, `@${username}, El ajuste "${setting}" no existe.`);
                }
            }

            break;
        case 'so':
            if (!isModerator) return;
            let targetStreamer = args[0];
            if (!settings.enable_community_features) return; // Don't shoutout if community features are disabled
            if (targetStreamer) {
                // Replace the @ symbol if it exists
                if (targetStreamer.startsWith('@')) {
                    targetStreamer = targetStreamer.slice(1);
                }
                try {
                    try {
                        const nativeShoutout = await HelixClient.asUser(process.env.TWITCH_USER_ID, (async client => {
                            let targetChannel = await client.users.getUserByName(targetStreamer);
                            let shoutout = await client.chat.shoutoutUser(channelData.twitch_id, targetChannel.id, process.env.TWITCH_USER_ID);
                            return shoutout;
                        }))
                    } catch (error) {
                        // Do nothing, continue with the bot shoutout
                        //console.error(error);
                    }

                    const shoutout = await Shoutout.findByTargetStreamer(channelData.id, targetStreamer);
                    if (shoutout && shoutout.enabled) {
                        sendMessage(channel, shoutout.message);
                    } else if (shoutout && !shoutout.enabled) {
                        sendMessage(channel, `drop a follow to @${targetStreamer} at https://twitch.tv/${targetStreamer} <3 !`);
                    } else {
                        sendMessage(channel, `drop a follow to @${targetStreamer} at https://twitch.tv/${targetStreamer} <3 !`);
                    }
                } catch (error) {
                    console.error(error.message);
                    sendMessage(channel, `drop a follow to @${targetStreamer} at https://twitch.tv/${targetStreamer} <3 !`);
                }
            } else {
                return

            }
            break;
        case 'clip':
            if (!settings.enable_clip_command) return;
            const currentChannel = await Channel.getChannelByName(channel);
            let clipData;
            HelixClient.asUser(process.env.TWITCH_USER_ID, (client => {
                client.clips.createClip({
                    channel: currentChannel.twitch_id
                }).then((clip) => {
                    console.log(clip);
                    clipData = clip;
                    sendMessage(channel, `@${username}, ¡Se ha creado un clip! https://clips.twitch.tv/${clip}`);
                }).catch((error) => {
                    console.error(error);
                    sendMessage(channel, `@${username}, ¡Ha ocurrido un error al intentar crear un clip!`);
                })
            }))

            break;
        case 'shoutout':
            if (!isModerator) return;
            if (!settings.enable_community_features) return; // Shoutout module are part of community features, so if they are disabled, don't execute the command
            const action = args[0];
            const target = args[1];
            let shoutoutMessage = args.slice(2).join(' ');
            // Replace the @ symbol if it exists
            if (target.startsWith('@')) {
                target = target.slice(1);
            }
            if (action === 'add') {
                if (!target || !shoutoutMessage) return;
                try {
                    const shoutout = await Shoutout.create(channelData.id, target, shoutoutMessage);
                    sendMessage(channel, `@${username}, ¡Shoutout creado correctamente!`);
                } catch (error) {
                    console.error(error.message);
                    sendMessage(channel, `@${username}, ¡Ha ocurrido un error al intentar crear el shoutout!`);
                }
            } else if (action === 'remove') {
                if (!target) return;
                try {
                    const shoutout = await Shoutout.findByTargetStreamer(channelData.id, target);
                    if (shoutout) {
                        await shoutout.delete();
                        sendMessage(channel, `@${username}, ¡Shoutout eliminado correctamente!`);
                    } else {
                        sendMessage(channel, `@${username}, ¡No se ha encontrado el shoutout!`);
                    }
                } catch (error) {
                    console.error(error.message);
                    sendMessage(channel, `@${username}, ¡Ha ocurrido un error al intentar eliminar el shoutout!`);
                }
            } else if (action === 'edit') {
                if (!target || !shoutoutMessage) return;
                try {
                    const shoutout = await Shoutout.findByTargetStreamer(channelData.id, target);
                    if (shoutout) {
                        shoutout.message = shoutoutMessage;
                        await shoutout.update();
                        sendMessage(channel, `@${username}, ¡Shoutout editado correctamente!`);
                    } else {
                        sendMessage(channel, `@${username}, ¡No se ha encontrado el shoutout!`);
                    }
                } catch (error) {
                    console.error(error.message);
                    sendMessage(channel, `@${username}, ¡Ha ocurrido un error al intentar editar el shoutout!`);
                }
            } else {
                return;
            }
            break;
        case 'debug':
            if (username !== 'alexitoo_uy') return;
            let debugCommand = args[0];
            switch (debugCommand) {
                case 'channelId':
                    sendMessage(channel, `Channel ID: ${channelData.id} (${channelData.twitch_id})`);
                    break;
                case 'assistant_clear':
                    clearAssistantHistory(channel);
                    sendMessage(channel, `@${username}, Historial de conversación limpiado correctamente.`);
                    break;
            }
            break;
        case 'petru':
            if (!settings.enable_conversation) return;
            if (isAssistantOnCooldown(channel, username)) return;
            try {
                let twitchChannelInfo = await getChannelInfo(channel.replace('#', ''));
                addToAssistantHistory(channel, message, username);
                let AssistantResponse = await createAssistantResponse(twitchChannelInfo, null, username, message, settings, channel);
                if (AssistantResponse) {
                    // Si ya mencionó al usuario en el mensaje (con @), no volver a mencionarlo
                    if (message.includes(`@${username}`)) {
                        sendMessage(channel, AssistantResponse);
                    }
                    // Si no, mencionarlo al inicio del mensaje
                    else {
                        sendMessage(channel, `@${username}, ${AssistantResponse}`);
                    }
                    addToAssistantHistory(channel, AssistantResponse, 'PetruquioBot');
                    if (username && username.toLowerCase() === 'alexitoo_uy') {
                        return;
                    } else {
                        setAssistantCooldown(channel, 15);
                    }

                }
            } catch (error) {
                console.error(error);
            }
            break;
        case 'team':
            if (!settings.enable_community_features) return;
            const option = args[0];
            const teamName = args[1];
            if (!option) return;
            if (option === 'live') {
                // Get channel team and then get live channels from that team
                try {
                    let channelData = await Channel.getChannelByName(channel);
                    let team = await Team.getById(channelData.team_id);
                    if (team) {
                        let teamChannels = await team.getMembers();
                        let nowLive = liveChannels.filter(channel => teamChannels.includes(channel.name)); // Use liveChannels variable to save API calls, because it's updated every 2 minutes
                        if (nowLive.length === 0) return sendMessage(channel, `@${username}, no hay canales en vivo en el team ${team.displayName || team.name}`)
                    } else {
                        return
                    }
                } catch (error) {
                    console.error(error.message);
                }
            }
            break;
        default:
            if (langList.includes(command) && settings.enable_translation) {
                try {
                    let translated = await translate(message, command, username)
                    sendMessage(channel, translated)
                } catch (error) {
                    return
                }
            }
            if (customCommand) {
                if (customCommand?.command_options?.enabled) {
                    const parsedReply = await replaceVariables({
                        commandResponse: customCommand.response,
                        channel,
                        username,
                        toUser
                    });
                    return sendMessage(channel, parsedReply);
                }
            }

            // Team commands, like !${teamName}-live to check live channels in a team, but also should work with !${teamName}live
            if (command.endsWith('-live') || command.endsWith('live')) {
                if (!settings.enable_community_features) return; // Team commands are part of community features, so if they are disabled, don't execute the command
                let teamName = command.replace(/-live|live/g, '');
                try {
                    let team = await Team.getByName(teamName);
                    if (team) {
                        let teamChannels = await team.getMembers();
                        let live = liveChannels
                        // TeamChannels is an array of objects, so we need to map it to an array of strings
                        teamChannels = teamChannels.map(channel => channel.name);
                        live = live.filter(channel => teamChannels.includes(channel.userName));
                        if (live.length === 0) return sendMessage(channel, `@${username}, no hay canales en vivo en el team ${team.displayName || team.name}`)
                        let liveChannelsNames = live.map(channel => channel.userName);
                        sendMessage(channel, `@${username}, los canales en vivo del team ${team.displayName} son: ${liveChannelsNames.join(', ')}`);
                    } else {
                        return
                    }
                } catch (error) {
                    console.error(error.message);
                }

            }



            return;
    }
};
