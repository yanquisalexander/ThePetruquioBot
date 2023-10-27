import chalk from 'chalk';
import Channel from '../models/Channel.model';
import { Bot } from '../../bot';

export const handleRaid = async (channel: string, username: string, viewers: number) => {
    console.log(chalk.green('[BOT]'), chalk.yellow(`${chalk.bold.cyan(username)} raided #${chalk.bold.cyan(channel)} with ${chalk.bold.cyan(viewers)} viewers`));
    const channelData = await Channel.findByUsername(channel);

    if(!channelData) return;
    if(channelData.preferences.enableRaidAlerts) {
        let message = `@${username} raided with ${viewers} viewers PopNemo`;

        if(channelData.preferences.minRaidViewers?.value && viewers < channelData.preferences.minRaidViewers.value) return;
        
        if(channelData.preferences.raidAlertMessage) {
            message = channelData.preferences.raidAlertMessage.value.replace('#username', username).replace('#viewers', viewers.toString());
        }

        const bot = await Bot.getInstance();
    
        bot.sendMessage(channel, message);


    }
}