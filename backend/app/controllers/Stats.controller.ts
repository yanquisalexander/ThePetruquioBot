import { Request, Response } from "express";
import MemoryVariables from "../../lib/MemoryVariables";
import { Bot } from "../../bot";
import MessageLogger from "../models/MessageLogger.model";
import User from "../models/User.model";
import Twitch from "../modules/Twitch.module";
import Redemption from "../models/Redemption.model";


class StatsController {

    public static async getStats(req: Request, res: Response): Promise<Response> {
        // Englobe all the stats in a single endpoint        
        const timezone = req.query.tz as string || 'UTC';
        const bot = await Bot.getInstance();
        const joinedChannels = (await Twitch.getUsersByList(bot.joinedChannels)).sort((a, b) => a.name.localeCompare(b.name));
        const lastUpdated = MemoryVariables.getLastLiveStreamsCheck();
        const nextUpdateIn = lastUpdated.getTime() + 120000 - Date.now();
        const processedMessages = await MessageLogger.getCount();
        const last30DaysMessageCount = await MessageLogger.getLast30Days(timezone);
        const last30DaysChannelPointsRedemptions = await Redemption.getLast30Days(timezone);
        const averageMessagesPerDay = last30DaysMessageCount.map(day => day.message_count).reduce((a, b) => a + b, 0) / last30DaysMessageCount.length;
        const averageRedemptionsPerDay = last30DaysChannelPointsRedemptions.map(day => day.redemption_count).reduce((a, b) => a + b, 0) / last30DaysChannelPointsRedemptions.length;
        const userCount = await User.count();
        return res.status(200).json({
            data: {
                channels: joinedChannels.map(channel => {
                    return {
                        id: channel.id,
                        display_name: channel.displayName,
                        username: channel.name,
                        description: channel.description,
                        profile_image_url: channel.profilePictureUrl.replace('300x300', '70x70'), // 70x70 is the smallest size
                    }
                }),
                live_channels: MemoryVariables.getLiveChannels().map(stream => {
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
                next_update_in: nextUpdateIn,
                messages: processedMessages,
                last_30_days_messages: last30DaysMessageCount,
                last_30_days_channel_points_redemptions: last30DaysChannelPointsRedemptions,
                average_messages_per_day: averageMessagesPerDay,
                average_redemptions_per_day: averageRedemptionsPerDay,
                users: userCount,
                uptime: Date.now() - new Date(bot.bootedAt()).getTime(),
                booted_at: bot.bootedAt(),
                timezone
            }
        })
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
        const nextUpdateIn = lastUpdated.getTime() + 120000 - Date.now();
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

    public static async getProcessedMessages(req: Request, res: Response): Promise<Response> {
        const total = await MessageLogger.getCount();
        return res.status(200).json({
            data: {
                messages: total
            }
        })
    }

}

export default StatsController;