import { Router } from "express";
import Channel from "../../app/models/Channel.js";
import axios from "axios";

const RankingRouter = Router();

RankingRouter.get("/:channel_name", async (req, res, next) => {
    try {
        const channelName = req.params.channel_name || null;
        if (channelName) {
            const channel = await Channel.getChannelByName(channelName);
            const channelRanking = await channel.getRanking();

            // Agrupar usuarios por nombre de usuario y contar
            const groupedRanking = channelRanking.reduce((acc, item) => {
                const existingItem = acc.find((el) => el.username === item.username);
                if (existingItem) {
                    existingItem.count++;
                } else {
                    acc.push({ ...item, count: 1 });
                }
                return acc;
            }, []);

            // añadir avatar a cada usuario
            for (const user of groupedRanking) {
                const userAvatar = await axios(`https://decapi.me/twitch/avatar/${user.username}`);
                user.avatar = userAvatar.data;
            }

            // ordenar por cantidad de count
            groupedRanking.sort((a, b) => b.count - a.count);
            

            res.json({
                data: groupedRanking,
            });
        } else {
            res.status(400).json({
                errors: ["Missing channel name."],
                error_type: "missing_parameters",
            });
        }
    } catch (error) {
        next(error);
    }
});


export default RankingRouter;