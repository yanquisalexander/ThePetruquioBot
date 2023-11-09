import { Command, CommandPermission } from "../models/Command.model";
import User from "../models/User.model";


const JoinCommand = new Command(
    'join',
    '*',
    [CommandPermission.VIEWER],
    'Une el bot a tu canal.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const botUsername = _bot.getBotClient().getUsername();

        const targetUser = await User.findByTwitchId(_user.id);
        const targetChannel = await targetUser?.getChannel();

        if (!targetChannel) {
            try {
                await targetUser?.createChannelWithPreferences();
            } catch (error) {
                console.error(error);
            }
        }


        if (_channel.user.username === botUsername) {
            if (_bot.joinedChannels.includes(_user.username)) {
                _bot.sendMessage(_channel, `@${_user.displayName}, el bot ya se encuentra en tu canal PopNemo`);
            }
        }


        return '';
    }
);

export default JoinCommand;