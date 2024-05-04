import { Request, Response } from 'express';
import { CommunityWall } from '../models/CommunityWall.model';
import Channel from '../models/Channel.model';


class CommunityWallController {
    static async findByChannel(req: Request, res: Response): Promise<Response> {
        const channel = await Channel.findByUsername(req.params.channelName);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        try {
            const communityWall = await CommunityWall.find(channel);

            return res.json({
                data: {
                    pixels: communityWall.pixels.map((pixel) => {
                        return {
                            x: pixel.x,
                            y: pixel.y,
                            color: pixel.color,
                            user: {
                                avatar: pixel.user?.avatar,
                                displayName: pixel.user?.displayName,
                                username: pixel.user?.username,
                                id: pixel.user?.twitchId,
                            },
                        };
                    }),
                    channel: {
                        avatar: channel.user.avatar,
                        displayName: channel.user.displayName,
                        username: channel.user.username,
                        id: channel.id,
                    },
                    canvas_size: channel.preferences.communityWallCanvasSize.value,
                }
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default CommunityWallController;