import Channel from "../models/Channel.model";
import { Command, CommandPermission } from "../models/Command.model";
import User from "../models/User.model";


const JoinCommand = new Command(
    'join',
    '*',
    [CommandPermission.EVERYONE],
    'Une el bot a tu canal.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        const botUsername = _bot.getBotClient().getUsername();

        const targetUser = await User.findByTwitchId(_user.id);
        let targetChannel = await targetUser?.getChannel();

        if (!targetChannel) {
            try {
                targetChannel = await targetUser?.createChannelWithPreferences();
                (targetChannel as Channel).autoJoin = true;
                await targetChannel?.save();
            } catch (error) {
                console.error(error);
            }
        }


        if (_channel.user.username === botUsername) {
            if (_bot.joinedChannels.includes(_user.username)) {
                await _bot.sendMessage(_channel, `@${_user.displayName}, el bot ya se encuentra en tu canal PopNemo`);
                return;
            }
        }


        try {
            await _bot.getBotClient().join(_user.username);
            await _bot.sendMessage(_channel, `@${_user.displayName}, el bot se ha unido a tu canal PopNemo`);
        } catch (error) {
            console.error(error);
        }
    }
);

export default JoinCommand;