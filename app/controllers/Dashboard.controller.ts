import { Request, Response } from 'express';
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import User from '../models/User.model';
import { Bot } from '../../bot';


class DashboardController {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }


    static async index(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        // Here we return bot status (Joined, muted, etc) and recommendations

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const bot = await Bot.getInstance();

        const isBotJoined = bot.joinedChannels.includes(channel.user.username);
        const isBotMuted = channel.preferences.botMuted?.value;

        return res.json({
            data: {
                bot: {
                    joined: isBotJoined,
                    muted: isBotMuted
                }
            }
        })

    }

    static async join(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

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
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

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