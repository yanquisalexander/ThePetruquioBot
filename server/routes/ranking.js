import { Router } from "express";
import Ranking from "../../app/models/Ranking.js";

const RankingRouter = Router();

RankingRouter.get("/:channel_name", (req, res, next) => {
    let channelName = req.params.channel_name || null;
    if (channelName) {
        let channelRanking = new Ranking({ channelName });
        channelRanking.getChannelRanking().then(ranking => {
            res.json(ranking);
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    }
})

export default RankingRouter;