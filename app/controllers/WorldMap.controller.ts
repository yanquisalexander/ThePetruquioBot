import { Request, Response } from 'express';
import Twitch from '../modules/Twitch.module';
import ImageProcessor from '../../lib/ImageProcessor';
import Channel from '../models/Channel.model';
import StreamerSonglist from '../modules/StreamerSonglist.module';
import Geolocation from '../modules/Geolocation.module';

class WorldMapController {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static async getSplashEmoteset(req: Request, res: Response): Promise<Response> {
        /* Check if path ends in .json */
        const isJson = req.path.endsWith('.json');
        const isPng = req.path.endsWith('.png');

        try {
            const channelName = req.params.channelName;

            const channel = await Twitch.Helix.users.getUserByName(channelName);

            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            const emotes = await Twitch.Helix.chat.getChannelEmotes(channel.id);

            if (!emotes) {
                return res.status(404).json({ error: 'Channel does not have any emotes' });
            }

            const emotesUrls = emotes.map(emote => emote.getImageUrl(2));

            const emoteSheet = await ImageProcessor.generateEmoteSprite(emotesUrls.slice(0, 6));

            // cache the emote sheet for 1 hour
            res.setHeader('Cache-Control', 'public, max-age=3600');
            if (isJson) {
                return res.status(200).json({
                    data: {
                        emoteSheet: emoteSheet.toDataURL()
                    }
                })
            } else if (isPng) {
                // Render the image
                res.status(200).write(emoteSheet.toBuffer("image/png"), 'binary');
                return res.end(null, 'binary');
            } else {
                return res.status(200).send(emoteSheet.toBuffer("image/png"));
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    public static async getWorldMap(req: Request, res: Response): Promise<Response> {
        try {
            const channelName = req.params.channelName;

            const channel = await Channel.findByUsername(channelName);

            let songRequests: any[] = [];

            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            if (!channel.preferences.enableCommunityMap?.value) {
                return res.status(404).json({ error: 'Channel does not have the community map enabled' });
            }

            if (channel.preferences.showSongRequestsOnMap?.value) {
                const sl = await StreamerSonglist.getChannel(channel.user.username);
                if (!sl) {
                    /* Continue if the channel doesn't have a songlist */
                    console.log(`Channel ${channel.user.username} does not have a songlist`);
                } else {
                    songRequests = await sl.getQueue();
                }
            }

            const worldMap = await channel.getWorldMap();

            if (!worldMap) {
                return res.status(404).json({ error: 'Channel does not have a world map' });
            }

            if (songRequests.length > 0) {
                worldMap.forEach((marker) => {
                    const songRequest = songRequests.find((songRequest) => songRequest.requests.find((request: { name: string; }) => request.name.toLowerCase() === marker.user_username));
                    if (songRequest) {
                        marker.songRequest = songRequest;
                    }
                })
            }

            return res.status(200).json({
                data: {
                    worldMap
                }
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    public static async getUserCard(req: Request, res: Response): Promise<Response> {
        try {
            const channelName = req.params.channelName;
            const username = req.params.username;


            const twitchUser = await Twitch.Helix.users.getUserByName(username);

            let songRequests: any[] = [];

            if (!twitchUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const channel = await Channel.findByUsername(channelName);

            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            if (channel.preferences.showSongRequestsOnMap?.value) {
                const sl = await StreamerSonglist.getChannel(channel.user.username);
                if (!sl) {
                    console.log(`Channel ${channel.user.username} does not have a songlist`);
                } else {
                    songRequests = await sl.getQueue()
                }
            }

            const userCard = {
                public_profile: {
                    cover: twitchUser.offlinePlaceholderUrl,
                },
                song_requests: songRequests
                    .filter((songRequest) =>
                        songRequest.requests.some((request: { name: string; }) => request.name.toLowerCase() === username)
                    )
                    .map((songRequest) => ({
                        id: songRequest.song.id,
                        title: songRequest.song.title,
                        artist: songRequest.song.artist,
                    })),
            };
            

           

            return res.status(200).json({
                data: {
                    user_card: userCard
                }
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}



export default WorldMapController;