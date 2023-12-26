import chalk from 'chalk';
import Channel from '../models/Channel.model';
import { Bot } from '../../bot';
import GreetingsManager from "../modules/GreetingsManager.module";
import Twitch from "../modules/Twitch.module";
import Shoutout from "../models/Shoutout.model";
import { defaultShoutoutMessages } from "../constants/Greetings.constants";
import Greeting from "../models/Greeting.model";

export const handleRaid = async (channel: string, username: string, viewers: number) => {
    console.log(chalk.green('[BOT]'), chalk.yellow(`${chalk.bold.cyan(username)} raided #${chalk.bold.cyan(channel)} with ${chalk.bold.cyan(viewers)} viewers`));
    const channelData = await Channel.findByUsername(channel);
    const raider = await Channel.findByUsername(username);

    if (!channelData) return;
    if (channelData.preferences.enableRaidAlerts?.value) {
        const bot = await Bot.getInstance();
        let message = `@${username} raided with ${viewers} viewers PopNemo`;

        if (channelData.preferences.minRaidViewers?.value && viewers < channelData.preferences.minRaidViewers.value) return;

        if (channelData.preferences.raidAlertMessage?.value) {
            message = channelData.preferences.raidAlertMessage.value.replace('#username', username).replace('#viewers', viewers.toString());
        }

        bot.sendMessage(channelData, message);

        if (channelData.preferences.enableShoutout?.value) {
            if (!raider) {
                return;
            }
            let shoutoutMessage = ''
            const shoutout = await Shoutout.find(channelData, raider.user);

            if (!shoutout) {
                shoutoutMessage = raider.preferences.shoutoutPresentation?.value || defaultShoutoutMessages[Math.floor(Math.random() * defaultShoutoutMessages.length)];
            } else {
                try {
                    await Greeting.updateShoutoutTimestamp(raider.user, channelData) // Prevents shoutout greeting
                } catch (error) {
                    console.error(error);
                }
                shoutoutMessage = shoutout.messages[Math.floor(Math.random() * shoutout.messages.length)];
            }

            GreetingsManager.addToGreetingStack(channelData, shoutoutMessage.replace(/#targetStreamer/g, raider.user.username));


            const targetShoutoutUser = await raider.user.fromHelix();

            if (!targetShoutoutUser) {
                return;
            }

            try {
                await Twitch.shoutout(channelData, targetShoutoutUser);
            } catch (error) {
                console.error(error);
            }
        }
    }
}