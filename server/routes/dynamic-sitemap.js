import { Router } from 'express';
import Channel from '../../app/models/Channel.js';

const DynamicSitemapRouter = Router();

DynamicSitemapRouter.get('/', async (req, res) => {
    const channels = await Channel.getAllChannels();
    let sitemapData = [];

    // Add Link to Map from channels that have it enabled
    channels.map(channel => {
        if (channel.settings && channel.settings.enable_community_map) {
            sitemapData.push({
                url: `https://petruquio.live/map/${channel.name}`,
                changefreq: 'daily',
                priority: 0.8
            });
        }
    });



    res.json(sitemapData);
}
);

export default DynamicSitemapRouter;