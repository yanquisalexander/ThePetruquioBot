import { Command, CommandPermission } from "../models/Command.model";
import Twitch from "../modules/Twitch.module";

export const langExpl = [
    'Unlock the magic of translation with commands like !en (English) or !pt (Portuguese).',
    'Expand your linguistic horizons with commands like !cn, !de, or !es.',
    'Master the art of multilingual communication with commands like !fi, !fr, or !jp.',
    'Speak in the languages of the world with commands like !kr, !pl, or !ru.',
    'Discover new cultures through language with commands like !ro, !tu, or !it.',
    'Elevate your conversations with commands like !es or !fr.',
];

const LanguageCommand = new Command(
    'lang',
    '*',
    [CommandPermission.EVERYONE],
    'Devuelve un mensaje explicando el uso del módulo de traducción.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        _bot.sendMessage(_channel, `@${_user.displayName}, ${langExpl[Math.floor(Math.random() * langExpl.length)]}`);
        return;
    }
);

export default LanguageCommand;