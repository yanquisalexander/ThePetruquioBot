import { Request, Response } from 'express';
import User from "../models/User.model";
import Channel from "../models/Channel.model";
import CurrentUser from "../../lib/CurrentUser";
import Session from "../models/Session.model";
import GotTalentJudge from "../models/GotTalentJudge.model";
import SocketIO from "../modules/SocketIO.module";

class ExtrasController {
    constructor() {
        throw new Error('This class cannot be instantiated.');
    }

    static async getGotTalentJudges(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);

        const channel = await currentUser.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        const judges = await GotTalentJudge.getJudges(channel);

        res.json({ data: { judges } });
    }

    static async addGotTalentJudge(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);

        const channel = await currentUser.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        const user = await User.findByUsername(req.body.username);

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        let judge;

        try {
            judge = await GotTalentJudge.addJudge(channel, user);

        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }
        res.json({ data: { judge } });
    }

    static async removeGotTalentJudge(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);

        const channel = await currentUser.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        if(!req.body.twitchId) {
            return res.status(400).json({ error: 'twitchId is required' })
        }

        const user = await User.findByTwitchId(parseInt(req.body.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        try {
            await GotTalentJudge.removeJudge(channel, user);

        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }

        res.json({ message: 'Judge removed' });
    }

    static async addCrossTalentJudge(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);
        const user = await currentUser.getCurrentUser();


        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }


        try {
            const isJudge = await GotTalentJudge.isJudge(channel, user);

            if (!isJudge) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            SocketIO.getInstance().emitEvent(`got-talent:${channel.user.username}`, 'add-cross', { twitchId: user.twitchId });
            res.json({
                success: true,
            });

        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }

    }

    static async goldenBuzzerTalentJudge(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);
        const user = await currentUser.getCurrentUser();


        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }


        try {
            const isJudge = await GotTalentJudge.isJudge(channel, user);

            if (!isJudge) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            SocketIO.getInstance().emitEvent(`got-talent:${channel.user.username}`, 'golden-buzzer', { twitchId: user.twitchId });
            res.json({
                success: true,
            });

        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }
    }

    static async clearGotTalentCrosses(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as any);
        const user = await currentUser.getCurrentUser();

        const channel = await user?.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        try {
            SocketIO.getInstance().emitEvent(`got-talent:${channel.user.username}`, 'clear-crosses', {});
            res.json({
                success: true,
            });

        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }
    }

    static async getGotTalentConfig(req: Request, res: Response) {
        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        res.json({ data: {
            judges: await GotTalentJudge.getJudges(channel),
            channel: channel.user
        } });
    }







}

export default ExtrasController;