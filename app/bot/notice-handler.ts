import { Bot } from "../../bot";

export const noticeHandler = async (channel: string, msgid: string, message: string) => {
    console.log(`[${channel}] NOTICE: ${msgid} - ${message}`);

    if(msgid === 'msg_banned') {
        console.log(`[${channel}] Banned from channel. Leaving... :(`);
        const bot = await Bot.getInstance();
        await bot.getBotClient().part(channel);
    }
};

    