import { defaultShoutoutMessages } from "../constants/Greetings.constants";
import Channel from "../models/Channel.model";
import { Command, CommandPermission } from "../models/Command.model";
import Twitch from "../modules/Twitch.module";


const ShoutoutCommand = new Command(
    'so',
    '*',
    [CommandPermission.MODERATOR],
    'Realiza un shoutout a un canal.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        if (_channel?.preferences?.enableShoutout?.value && _args[0]) {
            let shoutoutMessage = ''
            const targetChannel = _args[0].replace('@', '');

            const targetChannelUser = await Twitch.getUser(targetChannel);

            if (!targetChannelUser) {
                shoutoutMessage = defaultShoutoutMessages[Math.floor(Math.random() * defaultShoutoutMessages.length)];
                _bot.sendMessage(_channel.user.username, `${shoutoutMessage.replace(/#targetStreamer/g, targetChannel)}`);
                return '';
            }

            try {
                await Twitch.shoutout(_channel, targetChannelUser);
            } catch (error) {
                console.error(error);
            }

            shoutoutMessage = defaultShoutoutMessages[Math.floor(Math.random() * defaultShoutoutMessages.length)];
            _bot.sendMessage(_channel.user.username, `${shoutoutMessage.replace(/#targetStreamer/g, targetChannelUser?.displayName || targetChannel)}`);

        }
        return '';
    }
);

export default ShoutoutCommand;