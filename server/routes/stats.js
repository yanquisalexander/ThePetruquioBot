import { Router } from "express";
import { Bot, bootedAt } from "../../bot.js";
import { WebServer } from "../boot-webserver.js";
import { latencyInfo, liveChannels } from "../../memory_variables.js";
import { getLiveChannels } from "../../utils/twitch.js";

const StatsRouter = Router();

StatsRouter.get("/", (req, res, next) => {    
    res.json({
        bootedAt,
        channels: Bot.getChannels().map(channel => channel.slice(1)),
        latency: latencyInfo,
        liveChannels: liveChannels.map(channel => channel.userName)
    })
})

StatsRouter.get("/live-now", async (req, res, next) => {
    try {
        const live = liveChannels.filter(channel => channel.userName !== 'petruquiobot');
        const liveData = live.map(channel => {
            const { userName, title, viewers, startDate } = channel;
            return {
                username: userName,
                title,
                viewers,
                startedAt:startDate,
                thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${userName.toLowerCase()}-320x180.jpg`,
                display_name: channel.userDisplayName,
            };
        });

        res.json({
            data: liveData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


export default StatsRouter;