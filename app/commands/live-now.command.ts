import MemoryVariables from "../../lib/MemoryVariables";
import { Command, CommandPermission } from "../models/Command.model";
import Twitch from "../modules/Twitch.module";


const LiveNowCommand = new Command(
    'livenow',
    '*',
    [CommandPermission.VIEWER],
    'Devuelve los canales en vivo en Petruquio.LIVE',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        if (_args.length === 0) {
            const liveChannels = MemoryVariables.getLiveChannels();

            if (liveChannels.length === 0) {
                return _bot.sendMessage(_channel, `@${_user.username}, no hay canales en vivo en este momento :(`);
            }
            return _bot.sendMessage(_channel, `@${_user.username}, los canales en vivo son: ${liveChannels.map(channel => channel.userDisplayName).join(', ')}`);
        }
        else {
            const targetUsername = _args[0].replace('@', '').toLowerCase();

            const isLive = await Twitch.isChannelLive(targetUsername)

            if (isLive) {
                return _bot.sendMessage(_channel, `@${_user.username}, sí, ${targetUsername} está en vivo ;)`);
            }
            else {
                return _bot.sendMessage(_channel, `@${_user.username}, parece que ${targetUsername} no está en vivo en este momento :(`);
            }
        }
    }
);

export default LiveNowCommand;