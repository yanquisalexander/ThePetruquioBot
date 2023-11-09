import { defaultShoutoutMessages } from "../constants/Greetings.constants";
import Twitch from "../modules/Twitch.module";
import Shoutout from "../models/Shoutout.model";
import User from "../models/User.model";
import { Command, CommandPermission } from "../models/Command.model";
import Utils from "../../lib/Utils";

const ShoutoutCommand = new Command(
    'so',
    '*',
    [CommandPermission.MODERATOR],
    'Realiza un shoutout a un canal.',
    {},
    '', // System commands don't need a response
    async (user, args, channel, bot) => {
        if (channel?.preferences?.enableShoutout?.value && args[0]) {
            const targetChannel = args[0].replace('@', '');
            const targetChannelTwitchUser = await Twitch.getUser(targetChannel.toLowerCase());

            let shoutoutMessage = defaultShoutoutMessages[Math.floor(Math.random() * defaultShoutoutMessages.length)];

            if (targetChannelTwitchUser) {
                const targetShoutoutUser = await User.findByTwitchId(parseInt(targetChannelTwitchUser.id));
                const targetShoutoutUserChannel = await targetShoutoutUser?.getChannel();
                if (targetShoutoutUser) {
                    const so = await Shoutout.find(channel, targetShoutoutUser);

                    if (so && so.messages.length > 0) {
                        shoutoutMessage = so.messages[Math.floor(Math.random() * so.messages.length)];
                    } else {
                        if (targetShoutoutUserChannel?.preferences?.shoutoutPresentation?.value && !Utils.emptyString(targetShoutoutUserChannel?.preferences?.shoutoutPresentation?.value)) {
                            shoutoutMessage = targetShoutoutUserChannel.preferences.shoutoutPresentation?.value || shoutoutMessage;
                        }
                    }
                }


                try {
                    await Twitch.shoutout(channel, targetChannelTwitchUser);
                } catch (error) {
                    console.error(error);
                }
            }

            bot.sendMessage(channel, shoutoutMessage.replace(/#targetStreamer/g, targetChannelTwitchUser?.displayName || targetChannel));
        }
    }
);

export default ShoutoutCommand;
