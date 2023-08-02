// main.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from "./routes/index.js";
import passport from '../lib/passport.js'
import { EventSubMiddleware } from '@twurple/eventsub-http';
import { AppClient } from "../utils/twitch.js";
import Channel from "../app/models/Channel.js";
import { pusher } from "../lib/pusher.js";
import { eventSubListeners } from "../memory_variables.js";
import { sendMessage } from "../bot.js";

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const WebServer = express();
export const TwitchEventSub = new EventSubMiddleware({
  apiClient: AppClient,
  hostName: process.env.NODE_ENV === 'production' ? 'api.petruquio.live' : 'api-local.petruquio.live',
  pathPrefix: '/twitch/eventsub',
  secret: 'A.RANDOM.SECRET.PETRUQUIO.BOT',
  legacySecrets: false,
});

// Middlewares
WebServer.use(cors('*'));
WebServer.use(passport.initialize());
WebServer.use('/api/', bodyParser.json(), routes);

// Error handling
WebServer.use((err, req, res, next) => {
  res.status(500).json({ error: err });
});

// Routes
WebServer.get('*', (req, res) => {
  res.status(404).json({
    errors: [
      "Apparently the requested URL or Resource could not be found 😿."
    ],
    error_type: "not_found"
  });
});

// Boot
WebServer.boot = async () => {
  await subscribeToEventsForAllChannels();
  TwitchEventSub.apply(WebServer);
  WebServer.listen(PORT, async () => {
    console.log(chalk.blue(`PetruquioBot WebServer listening on port ${PORT}`));
    TwitchEventSub.markAsReady();
  });
};

// Subscribe to events for a channel
export const subscribeToEvents = async (channel) => {
  if (channel.settings.enable_live_notification.value) {
    await subscribeToLiveNotificationEvents(channel);
  } else {
    // Remove listener if exists
    if (eventSubListeners[`${channel.name}-live`]) {
      eventSubListeners[`${channel.name}-live`].stop();
      delete eventSubListeners[`${channel.name}-live`];
    }
  }

  if (channel.settings.enable_first_ranking.value) {
    await subscribeToFirstRankingEvents(channel);
  } else {
    // Remove listener if exists
    if (eventSubListeners[`${channel.name}-reward`]) {
      eventSubListeners[`${channel.name}-reward`].stop();
      delete eventSubListeners[`${channel.name}-reward`];
    }
  }
};

// Subscribe to first ranking events
const subscribeToFirstRankingEvents = async (channel) => {
  if (channel.settings.first_ranking_twitch_reward.value) {
    const rewardListener = TwitchEventSub.onChannelRedemptionAdd(channel.twitch_id, async (event) => {
      const cachedChannel = await Channel.getChannelByName(channel.name);
      if (!cachedChannel.settings.enable_first_ranking.value) {
        console.log(`Channel ${channel.name} has first ranking disabled. Skipping...`);
        return;
      }
      if (event.rewardId === cachedChannel.settings.first_ranking_twitch_reward.value) {
        console.log(`${event.userName} has redeemed ${event.rewardTitle} on channel ${channel.name}`);
        await pusher.trigger(`channel-${channel.name}`, 'first-ranking', {
          user: event.userName,
          reward: event.rewardTitle
        });
        await Channel.addToRanking(event.userName, event.broadcasterId);
        sendMessage(channel.name, `¡${event.userName} ha sido el que canjeó ${event.rewardTitle}! GivePLZ`);
      }
    });

    // Guardar la suscripción en variables de memoria para poder eliminarlo más tarde
    eventSubListeners[`${channel.name}-reward`] = rewardListener;
  } else {
    console.log(`Channel ${channel.name} has first ranking enabled but no reward selected. Skipping...`);
  }
};

// Subscribe to live notification events
const subscribeToLiveNotificationEvents = async (channel) => {
  const liveListener = TwitchEventSub.onStreamOnline(channel.twitch_id, async (event) => {
    const cachedChannel = await Channel.getChannelByName(channel.name);
    if (!cachedChannel.settings.enable_live_notification.value) {
      console.log(`Channel ${channel.name} has live notifications disabled. Skipping...`);
      return;
    }
    const stream = await event.getStream();
    const title = stream?.title ? stream.title : '';
    const message = cachedChannel.settings.live_notification_message.value
      .replace('#channel', channel.name)
      .replace('#title', title)
      .replace('#game', stream?.gameName ? stream.gameName : '');
    sendMessage(channel.name, message);
  });
  eventSubListeners[`${channel.name}-live`] = liveListener;
};

// Subscribe to events for all channels
const subscribeToEventsForAllChannels = async () => {
  const channels = await Channel.getAllChannels();
  for (const channel of channels) {
    const cachedChannel = await Channel.getChannelByName(channel.name);
    await subscribeToEvents(cachedChannel);
  }
};

// Event subscription handlers
TwitchEventSub.onSubscriptionCreateFailure(async (event) => {
  console.log(`Subscription to ${event} failed.`);
});

TwitchEventSub.onSubscriptionCreateSuccess(async (event) => {
  console.log(`Subscription to ${event} created.`);
});

