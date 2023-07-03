import { Bot } from "../bot.js";
import { autoTranslateUsers } from "../memory_variables.js";
import { getRandomFact } from "./random-responses.js";
import { langExpl, langList, translate } from "./translate.js";
import { replaceVariables } from "../utils/variable-replacement.js";

const sendMessage = (channel, message) => {
    Bot.say(channel, message);
}

export const handleCommand = async ({ channel, context, username, message, toUser }) => {
    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    switch (command) {
        case 'hola':
            return sendMessage(channel, await replaceVariables({ commandResponse: 'Sender: ${sender} ${fetch https://api.yanquisalexander.me/ping} toUser: ${touser} randomNum: ${randomNum 200-500}', channel, username, toUser }));
        case 'chao':
            return sendMessage(channel, `Chao, @${username}!`);
        case 'bot':
            return sendMessage(channel, `Soy un bot creado por @${process.env.BOT_CREATOR}!`);
        case 'so':
            return sendMessage(channel, `Recomiendo visitar el canal de @${process.env.BOT_CREATOR} en https://twitch.tv/${process.env.BOT_CREATOR}!`);
        case 'discord':
            return sendMessage(channel, `Únete a nuestro Discord en https://discord.gg/${process.env.DISCORD_INVITE}!`);
        case 'twitter':
            return sendMessage(channel, `Síguenos en Twitter en https://twitter.com/${process.env.TWITTER_USERNAME}!`);
        case 'instagram':
            return sendMessage(channel, `Síguenos en Instagram en https://instagram.com/${process.env.INSTAGRAM_USERNAME}!`);
        case 'youtube':
            return sendMessage(channel, `Síguenos en YouTube en https://youtube.com/${process.env.YOUTUBE_USERNAME}!`);
        case 'whoami':
            return sendMessage(channel, `Eres ${username}!`);
        case 'comandos':
            return sendMessage(channel, `!hola, !chao, !bot, !so, !discord, !twitter, !instagram, !youtube, !donar, !comandos`);
        case 'lang':
            return sendMessage(channel, langExpl[Math.floor(Math.random() * langExpl.length)]);
        case 'random':
            return sendMessage(channel, `@${username}, ${getRandomFact()}`)
        case 'autotranslate':
            const user = args[0].toLowerCase();
            if (user) {
                autoTranslateUsers[user] = true;
                setTimeout(() => {
                    delete autoTranslateUsers[user];
                }, 5 * 60 * 1000); // 5 minutos
                sendMessage(channel, `Los mensajes de @${user} serán traducidos automáticamente al idioma del canal durante los próximos 5 minutos.`);
            } else {
                sendMessage(channel, `Debes especificar un nombre de usuario después del comando !autotranslate.`);
            }
            return;
        default:
            if (langList.includes(command)) {
                let translated = await translate(message, command, username)
                sendMessage(channel, translated)
            }
            return;
    }
};
