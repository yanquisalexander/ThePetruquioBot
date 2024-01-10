import { Request, Response } from 'express';
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import User from '../models/User.model';
import { Bot } from '../../bot';
import CurrentUser from '../../lib/CurrentUser';
import MessageLogger from '../models/MessageLogger.model';
import { FieldTypes } from '../../utils/ChannelPreferences.class';


class DashboardController {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }


    static async index(req: Request, res: Response) {
        // Here we return bot status (Joined, muted, etc) and recommendations

        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const bot = await Bot.getInstance();
        const timezone = req.query.tz as string || 'UTC';
        const last30DaysMessageCount = await MessageLogger.getLast30DaysByChannel(channel, timezone);

        const stats = {
            top_chatters: await MessageLogger.getTop10ByChannel(channel),
            last_30_days_messages: last30DaysMessageCount,
            average_messages_per_day: last30DaysMessageCount.map((day) => day.message_count).reduce((a, b) => a + b, 0) / last30DaysMessageCount.length,
        }

        const isBotJoined = bot.joinedChannels.includes(channel.user.username);
        const isBotMuted = channel.preferences.botMuted?.value;

        const isPatron = await user.isPatron();
        return res.json({
            data: {
                bot: {
                    joined: isBotJoined,
                    muted: isBotMuted
                },
                stats,
                timezone,
                is_patron: isPatron
            }
        })

    }

    static async sendMessageAsBot(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
        }

        const bot = await Bot.getInstance();

        if (!bot.joinedChannels.includes(channel.user.username)) {
            return res.status(400).json({ error: 'BOT_NOT_JOINED' });
        }

        if (channel.preferences.botMuted?.value) {
            return res.status(400).json({ error: 'BOT_MUTED' });
        }

        try {
            bot.sendMessage(channel, req.body.message);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.json({ data: { success: true } });
    }

    static async toggleMute(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        channel.preferences.botMuted.value = !channel.preferences.botMuted.value;
        await channel.save();

        const bot = await Bot.getInstance();

        if (!bot.joinedChannels.includes(channel.user.username)) {
            return res.status(400).json({ error: 'Bot not joined' });
        }

        if (!channel.preferences.botMuted?.value) {
            bot.sendMessage(channel, 'Hey! I\'m back! DinoDance (petruquiobot unmuted)');
        }

        return res.json({ data: { success: true } });
    }

    static async join(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        channel.autoJoin = true;
        await channel.save();

        const bot = await Bot.getInstance();

        if (bot.joinedChannels.includes(channel.user.username)) {
            return res.status(400).json({ error: 'Bot already joined' });
        }

        try {
            await bot.joinChannel(channel.user.username);
            bot.sendMessage(channel, 'Hey! Ready to rock and roll! DinoDance (petruquiobot joined the channel)');
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.json({ data: { success: true } });
    }

    static async part(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        channel.autoJoin = false;
        await channel.save();

        const bot = await Bot.getInstance();

        if (!bot.joinedChannels.includes(channel.user.username)) {
            return res.status(400).json({ error: 'Bot already parted' });
        }

        try {
            await bot.getBotClient().part(channel.user.username);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.json({ data: { success: true } });
    }

}

export default DashboardController;