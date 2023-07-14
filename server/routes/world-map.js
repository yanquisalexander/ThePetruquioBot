import { Router } from "express";
import WorldMap from "../../app/models/WorldMap.js";
import Channel from "../../app/models/Channel.js";

const WorldMapRouter = Router();

WorldMapRouter.get("/:channel_name", async (req, res, next) => {
    let channelName = req.params.channel_name || null;
    const channel = await Channel.getChannelByName(channelName);
    if (!channel) {
        return res.status(404).json({
            errors: [
                "Channel not found"
            ],
            error_type: "channel_not_found"
        });
    }


    if(channel.settings.enable_community_map.value === false) {
        return res.status(404).json({
            errors: [
                "Community map is disabled"
            ],
            error_type: "community_map_disabled"
        });
    }

    if (channelName) {
        WorldMap.getChannelMap(channelName).then(worldMap => {
            res.json(worldMap);
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    }
})

export default WorldMapRouter;