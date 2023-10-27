import { Request, Response } from "express";
import MemoryVariables from "../../lib/MemoryVariables";
import { Bot } from "../../bot";


class StatsController {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static async uptime(req: Request, res: Response): Promise<Response> {
        const bot = await Bot.getInstance();
        return res.status(200).json({
            data: {
                uptime: Date.now() - new Date(bot.bootedAt()).getTime()
            }
        })
    }

    public static async getLiveChannels(req: Request, res: Response): Promise<Response> {
        return res.status(200).json({
            data: {
                channels: MemoryVariables.getLiveChannels()
            }
        })
    }
}

export default StatsController;