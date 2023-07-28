import { Router } from "express";
import { Bot, bootedAt } from "../../bot.js";
import { WebServer } from "../boot-webserver.js";

const StatsRouter = Router();

StatsRouter.get("/", (req, res, next) => {
    res.json({
        bootedAt,
        channels: Bot.getChannels().map(channel => channel.slice(1))
    })
})


export default StatsRouter;