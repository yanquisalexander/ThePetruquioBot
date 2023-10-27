import { Bot } from "../../bot";
import Channel from "../models/Channel.model";

export const noticeHandler = async (channel: string, msgid: string, message: string) => {
    console.log(`[${channel}] NOTICE: ${msgid} - ${message}`);

    if(msgid === 'msg_banned') {
        console.log(`[${channel}] Banned from channel. Leaving... :(`);
        const bot = await Bot.getInstance();
        try {
            await bot.getBotClient().part(channel);
        } catch (error) {
            console.error(`[${channel}] Error leaving channel:`, error);
        }

        const channelDb = await Channel.findByUsername(channel.replace('#', ''));

        if(channelDb) {
            channelDb.autoJoin = false;
            await channelDb.save();
            console.log(`[${channel}] Autojoin disabled for ${channel}`);
        }

    }
};

    