import tmi from 'tmi.js'
import dotenv from 'dotenv'
dotenv.config()


export const Bot = new tmi.Client({
    identity: {
        username: process.env.BOT_NAME,
        password: process.env.BOT_PASSWORD
    },
    channels: process.env.CHANNELS.split(',')
})