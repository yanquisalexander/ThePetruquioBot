import { Router } from "express";
import { AppClient, getChannelInfo } from "../../utils/twitch.js";
import TES from "tesjs";
import { WebServer } from "../boot-webserver.js";

const TwitchRouter = Router();
/* 
// initialize TESjs
const tes = new TES({
    identity: {
        id: process.env.TWITCH_CLIENT_ID,
        secret: process.env.TWITCH_CLIENT_SECRET
    },
    listener: {
        type: "webhook",
        baseURL: process.env.NODE_ENV === "production" ? "https://api.petruquiobot.live" : "https://api-local.petruquiobot.live",
        secret: 'WEBHOOKS_SECRET', // this should be different from your client secret and should also be using an environment variable,
        server: WebServer
    }
});
     let c = await getChannelInfo('alexitoo_uy')
tes.subscribe('channel.channel_points_custom_reward_redemption.add', { 
    broadcaster_user_id: c.id // the id of the channel you want to listen to
}).catch(err => {
    console.log(err)
})

tes.on('channel.channel_points_custom_reward_redemption.add', async (event) => {
    console.log(event)
    // do something with the event
}) */


export default TwitchRouter;