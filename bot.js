import tmi from 'tmi.js'
import dotenv from 'dotenv'
import { KMI } from './lib/kick.js'
import Channel from './app/models/Channel.js'
dotenv.config()


export const Bot = new tmi.Client({
    identity: {
        username: process.env.BOT_NAME,
        password: process.env.BOT_PASSWORD
    },
    channels: process.env.NODE_ENV === 'production' ? await Channel.getAutoJoinChannels() : process.env.CHANNELS.split(',')
})

export const KickBot = new KMI([],
    process.env.KICK_BOT_TOKEN
)


export const sendMessage = (channel, message, platform = 'twitch') => {
    if (platform === 'twitch') {
        Bot.say(channel, message);
    }
    else if (platform === 'kick') {
        console.log({ channel, message, platform })
        KickBot.say(channel, message);
    }
};