import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from "./routes/index.js";
import passport from '../lib/passport.js'
import status from 'express-status-monitor'
import { EventSubMiddleware } from '@twurple/eventsub-http';
import { AppClient } from "../utils/twitch.js";
import Channel from "../app/models/Channel.js";
import { pusher } from "../lib/pusher.js";
import { rewardsSubs } from "../memory_variables.js";
const PORT = process.env.PORT || 3000;

export const WebServer = express();


export const TwitchEventSub = new EventSubMiddleware({
  apiClient: AppClient,
  hostName: process.env.NODE_ENV === 'production' ? 'api.petruquio.live' : 'api-local.petruquio.live',
  pathPrefix: '/twitch/eventsub',
  secret: 'A.RANDOM.SECRET.PETRUQUIO.BOT'
});

// On Boot, check if there are channels with first ranking enabled and subscribe to the event
Channel.getRankingEnabledChannels().then(channels => {
  channels.map(channel => {
    if (channel.settings.enable_first_ranking.value) {
      console.log(`Channel ${channel.name} has first ranking enabled`);
      if (channel.settings.first_ranking_twitch_reward.value) {
        console.log(`Trying to subscribe to channel ${channel.name} for first ranking`);
        let rewardListener = TwitchEventSub.onChannelRedemptionAdd(channel.twitch_id, async (event) => {
          let cachedChannel = await Channel.getChannelByName(channel.name);
          if (event.rewardId === cachedChannel.settings.first_ranking_twitch_reward.value) {
            console.log(`${event.userName} has redeemed ${event.rewardTitle} on channel ${channel.name}`);
            await pusher.trigger(`channel-${channel.name}`, 'first-ranking', {
              user: event.userName,
              reward: event.rewardTitle
            });
            await Channel.addToRanking(event.userName, event.broadcasterId)
          }
        })

        // Save the subscription id to the memory variables to be able to delete it later or check if it exists
        rewardsSubs[channel.name] = rewardListener.id
      }
      else {
        console.log(`Channel ${channel.name} has first ranking enabled but no reward selected. Skipping...`);
      }
    }
  })
})

TwitchEventSub.onSubscriptionCreateFailure(async (event) => {
  console.log(`Subscription to ${event.subscription.type} failed. Reason: ${event.reason}`);
})

TwitchEventSub.onSubscriptionCreateSuccess(async (event) => {
  console.log(`Subscription to ${event.subscription.type} created.`);
})




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



WebServer.use(cors('*'))
WebServer.use(passport.initialize())



WebServer.use(status())

WebServer.use('/api/', bodyParser.json(), routes)

WebServer.use

WebServer.get('*', (req, res) => {
  res.status(404).json({
    errors: [
      "Apparently the requested URL or Resource could not be found 😿."
    ],
    error_type: "not_found"
  })
})


TwitchEventSub.apply(WebServer);


WebServer.use((err, req, res, next) => {
  res.status(500).json({ error: err });
});


WebServer.boot = async () => {
  WebServer.listen(PORT, async () => {
    console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
    TwitchEventSub.markAsReady();
  })
}

