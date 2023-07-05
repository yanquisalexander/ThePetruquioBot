import { Bot, sendMessage } from "../bot.js";
import { autoTranslateUsers } from "../memory_variables.js";
import { getRandomFact } from "./random-responses.js";
import { langExpl, langList, translate } from "./translate.js";
import { replaceVariables } from "../utils/variable-replacement.js";
import SpectatorLocation from "../app/models/SpectatorLocation.js";
import WorldMap from "../app/models/WorldMap.js";


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
                const worldMap = new WorldMap(username, channel, true, messageContent, messageContent);
                await worldMap.save();
                sendMessage(channel, `Tu mensaje personalizado ha sido guardado.`);
            } else {
                sendMessage(channel, `Debes especificar un mensaje después del comando !msg.`);
            }
            return;
        case 'show':
            const showMap = new WorldMap(username, channel, true);
            await showMap.save();
            sendMessage(channel, `Tu ubicación será mostrada en el mapa.`);
            return;
        case 'hide':
            const hideMap = new WorldMap(username, channel, false);
            await hideMap.save();
            sendMessage(channel, `Tu ubicación no será mostrada en el mapa.`);
            return;
        default:
            if (langList.includes(command)) {
                let translated = await translate(message, command, username)
                sendMessage(channel, translated)
            }
            return;
    }
};
