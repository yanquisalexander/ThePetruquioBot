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
        const lastUpdated = MemoryVariables.getLastLiveStreamsCheck();
        const nextUpdateIn = 120000 - (Date.now() - lastUpdated.getTime());
        return res.status(200).json({
            data: {
                channels: MemoryVariables.getLiveChannels().map(stream => {
                    return {
                        username: stream.userName,
                        display_name: stream.userDisplayName,
                        title: stream.title,
                        viewers: stream.viewers,
                        thumbnail_url: stream.thumbnailUrl,
                        started_at: stream.startDate,
                        language: stream.language,
                        tags: stream.tags,
                        game_id: stream.gameId,
                        game_name: stream.gameName,
                        type: stream.type,
                        is_mature: stream.isMature,
                    }
                }),
                last_updated: lastUpdated,
                next_update_in: nextUpdateIn
            }
        })
    }

    public static async getJoinedChannels(req: Request, res: Response): Promise<Response> {
        const bot = await Bot.getInstance();
        return res.status(200).json({
            data: {
                channels: bot.joinedChannels
            }
        })
    }

}

export default StatsController;