import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from "./routes/index.js";
import { EventSubMiddleware } from "@twurple/eventsub-http";
import { HelixClient, getChannelInfo } from "../utils/twitch.js";

const PORT = process.env.PORT || 3000;

export const WebServer = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

WebServer.use(bodyParser.json());
WebServer.use(cors('*'))

WebServer.use('/', routes)

const middleware = new EventSubMiddleware({
	apiClient: HelixClient,
	hostName: process.env.NODE_ENV === 'production' ? 'api.petruquio.live' : 'api-local.petruquio.live',
	pathPrefix: '/twitch/eventsub',
    strictHostCheck: false,
    legacySecrets: false,
	secret: 'petruquiobot'
});


middleware.apply(WebServer);




WebServer.use((err, req, res, next) => {
    res.status(500).json({ error: err });
});


WebServer.boot = async () => {
    WebServer.listen(PORT, async () => {
        console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
        await middleware.markAsReady();
        let channel = await getChannelInfo('petruquiobot');
        WebServer._router.stack.forEach(function (r) {
            if (r.route && r.route.path) {
                console.log(r.route.path)
            }
        })
        console.log(channel.broadcasterType)
        middleware.onSubscriptionCreateFailure((data => {
            console.log(data)
        }))
        middleware.onSubscriptionCreateSuccess((data => {
            console.log(data.id)
        }))
        middleware.onChannelRedemptionAddForReward(channel.id, '2800451e-f4a0-4db7-a359-f0eebae64dbb', (data => {
            console.log(data.broadcasterDisplayName)
        }))
    })

    
    
}

