import { Router } from "express";
import WorldMap from "../../app/models/WorldMap.js";

const WorldMapRouter = Router();

WorldMapRouter.get("/:channel_name", (req, res, next) => {
    let channelName = req.params.channel_name || null;
    if (channelName) {
        WorldMap.getChannelMap(channelName).then(worldMap => {
            res.json(worldMap);
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    }
})

export default WorldMapRouter;