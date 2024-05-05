import chalk from 'chalk';
import SocketIO from "@/app/modules/SocketIO.module";
import Channel from "@/app/models/Channel.model";

export const handleClearedChat = async (channel: string) => {
    console.log(chalk.green('[BOT]'), chalk.yellow(`Chat cleared in ${chalk.bold.cyan(channel)}`));
    const channelInfo = await Channel.findByUsername(channel.replace('#', ''))
    if (!channelInfo) {
        return;
    }

    SocketIO.getInstance().emitEvent(`stream-manager:${channelInfo.twitchId}`, 'chat-cleared', null);
}