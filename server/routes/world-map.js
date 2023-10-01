import { Router } from "express";
import WorldMap from "../../app/models/WorldMap.js";
import Channel from "../../app/models/Channel.js";
import User from "../../app/models/User.js";
import Cache from "../../app/Cache.js";
import { Bot, sendMessage } from "../../bot.js";
import { mapUpdateProgress } from "../../memory_variables.js";
import Greeting from "../../app/models/Greetings.js";
import { HelixClient, getChannelInfo } from "../../utils/twitch.js";
import axios from "axios";

export const WorldMapCache = new Cache();

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

    const channelEmotes = await HelixClient.chat.getChannelEmotes(channel.twitch_id);

    let emotes = channelEmotes.map(emote => {
        return {
            name: emote.name,
            url: emote.getFormattedImageUrl('3.0', 'static', 'dark')
        }
    })

    if (channel.settings.enable_community_map.value === false) {
        return res.status(404).json({
            errors: [
                "Community map is disabled"
            ],
            error_type: "community_map_disabled"
        });
    }


    let lastSeens = await Greeting.allLastSeen(channelName);

    if (channelName) {
        WorldMap.getChannelMap(channelName).then(async worldMap => {

            const songlistChannel = await axios.get(`https://api.streamersonglist.com/v1/streamers/${channelName}`)
            let slQueue = []
            if (songlistChannel.status === 200) {
                const songlistQueue = await axios.get(`https://api.streamersonglist.com/v1/streamers/${songlistChannel.data.id}/queue`)
                if (songlistQueue.status === 200) {
                    slQueue = songlistQueue.data.list

                    for (const request of slQueue) {
                        const username = request.requests[0].name;
                        const songRequested = request.song

                        const userInMap = WorldMapCache.get(channelName).find(user => user.username.toLowerCase() === username.toLowerCase())

                        if (userInMap) {
                            userInMap.song = songRequested
                        }
                    }
                }
            }

            for (const marker of worldMap) {
                const user = await User.findByUsername(marker.username);
                if (!user) continue; // If the user doesn't exist, skip to the next iteration
                const discord = await user.getConnectedAccountInfo('discord');
                if (discord) {
                    marker.discordId = discord.userinfo.id;
                }
                lastSeens.map(lastSeen => {
                    if (lastSeen.username === marker.username) {
                        marker.last_seen = lastSeen.last_seen;
                    }
                })

                slQueue.map(request => {
                    if (request.requests[0].name.toLowerCase() === marker.username) {
                        marker.song = request.song
                    }
                })
            }


            return res.json({
                map: worldMap,
                update: mapUpdateProgress[channelName] ? mapUpdateProgress[channelName] : null,
                emotes
            })

        }).catch(error => {
            res.status(500).json({ error: error });
        });
    }
})

WorldMapRouter.post("/:channel_name/viewer-found", async (req, res, next) => {
    let channelName = req.params.channel_name || null;
    const { username, score, finished, currentUser } = req.body;

    if (!username) {
        return res.status(400).json({
            errors: [
                "Username is required"
            ],
            error_type: "username_required"
        });
    }

    if (!score) {
        return res.status(400).json({
            errors: [
                "Score is required"
            ],
            error_type: "score_required"
        });
    }

    let Channels = Bot.getChannels().map(channel => channel.replace("#", ""));
    if (!Channels.includes(channelName)) {
        return res.status(404).json({
            errors: [
                "Bot is not in this channel"
            ],
            error_type: "bot_not_in_channel"
        });
    }

    if (channelName !== currentUser) {
        return res.status(400).json({
            errors: [
                "Username and channel name must be the same to post a viewer found message"
            ],
            error_type: "username_and_channel_name_must_be_the_same"
        });
    }

    if (!finished) {
        sendMessage(channelName, `@${channelName} has found @${username}! Their score is ${score}!`);
    } else {
        sendMessage(channelName, `@${channelName} has found @${username}! Their score is ${score}! They have finished the game!`);
    }

    return res.json({
        success: true
    });
});



export default WorldMapRouter;