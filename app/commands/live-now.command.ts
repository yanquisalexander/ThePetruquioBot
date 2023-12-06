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

            const currentChannel = MemoryVariables.getLiveChannels().find(channel => channel.userName === _channel.user.username);

            if (liveChannels.length === 0 || (currentChannel && liveChannels.length === 1)) {
                if(!currentChannel) {
                    return _bot.sendMessage(_channel, `@${_user.displayName}, no hay canales en vivo en este momento`);
                }
                return _bot.sendMessage(_channel, `@${_user.displayName}, no hay canales en vivo en este momento (Excepto @${currentChannel.userDisplayName}, por supuesto KonCha )`);
            }
            return _bot.sendMessage(_channel, `@${_user.displayName}, los canales en vivo son: ${liveChannels.map(channel => channel.userDisplayName).join(', ')}`);
        }
        else {
            const targetUsername = _args[0].replace('@', '').toLowerCase();

            try {
                const isLive = await Twitch.isChannelLive(targetUsername)

                if (isLive) {
                    return _bot.sendMessage(_channel, `@${_user.displayName}, sí, ${targetUsername} está en vivo ;)`);
                }
                else {
                    return _bot.sendMessage(_channel, `@${_user.displayName}, parece que ${targetUsername} no está en vivo en este momento :(`);
                }
            } catch (error) {
                return _bot.sendMessage(_channel, `@${_user.displayName}, an error ocurred while checking if ${targetUsername} is live (Maybe the channel doesn't exist?) :(`);
            }

            
        }
    }
);

export default LiveNowCommand;