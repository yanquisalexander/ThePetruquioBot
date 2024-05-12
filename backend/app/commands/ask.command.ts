import { Command, CommandPermission } from "../models/Command.model";
import User from "../models/User.model";
import Twitch from "../modules/Twitch.module";


const AskCommand = new Command(
    'ask',
    '*',
    [CommandPermission.EVERYONE],
    'Permite al espectador preguntar algo al bot.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const user = await User.findByTwitchId(_user.id);

        if (!user) return;


        const question = _args.join(' ');

        if (!question) {
            return;
        }

        try {
            const response = 'Estoy en mantenimiento, por favor intenta más tarde.'
            // Si la respuesta contiene el username, no incluirlo al inicio
            if (response.includes(user.username)) {
                return _bot.sendMessage(_channel, response);
            }
            return _bot.sendMessage(_channel, `@${_user.displayName}, ${response}`);
        } catch (error) {
            console.warn(error);
            return _bot.sendMessage(_channel, `@${_user.displayName}, no puedo responder a tu pregunta en este momento. Intenta de nuevo más tarde.`);
        }






    }
);

export default AskCommand;