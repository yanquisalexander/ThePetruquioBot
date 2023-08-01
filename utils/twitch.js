import { ApiClient } from '@twurple/api';
import { authProvider, appTokenProvider } from '../lib/twitch-auth.js';
import Cache from '../app/Cache.js';

const TwitchCache = new Cache();


export const AppClient = new ApiClient({
    authProvider: appTokenProvider
});

export const HelixClient = new ApiClient({
    authProvider
});


export const isFollower = async (username, channel) => {
    try {
        const user = await HelixClient.users.getUserByName(username);
        const channelInfo = await HelixClient.users.getUserByName(channel);
        const follows = await HelixClient.users.getFollows({ user, followedUser: channelInfo });
        const follower = follows.total > 0;
        return follower;
    } catch (error) {
        console.error(`Error al verificar si es seguidor: ${error}`);
        return false;
    }
};

export const knownBots = ["streamelements", "streamlabs", "nightbot"];




export const getChannelInfo = async (channelName) => {
    const cachedData = TwitchCache.get(channelName);
    if (cachedData) {
        return cachedData;
    }

    try {
        const user = await HelixClient.users.getUserByName(channelName);
        TwitchCache.set(channelName, user);
        return user;
    } catch (error) {
        console.error(`Error al obtener la información del broadcaster: ${error}`);
        return null;
    }
};

export const timeoutUser = async (channelID, userID, duration, reason) => {
    console.log(`Dando timeout a ${userID} en ${channelID} por ${duration} segundos`);
    const moderator = await getChannelInfo('petruquiobot');
    try {
        HelixClient.asUser(moderator, async (client) => {
            let response = await client.moderation.banUser(channelID, moderator, {
                reason,
                duration,
                user: userID
            });
            return response;
        });
    }
    catch (error) {
        console.error(`No se puede dar timeout: ${error}`);
        console.error(error);
        return null;
    }
};

export const banUser = async (channelID, userID, reason) => {
    try {
        const response = await timeoutUser(channelID, userID, 604800, reason); // 1 semana
        return response;
    } catch (error) {
        console.error(`No se puede banear: ${error}`);
        return null;
    }
};

export const getStreamInfo = async (channelID) => {
    try {
        const stream = await HelixClient.streams.getStreamByUserId(channelID);

        if (stream) {
            const { title, gameName, startDate, tags } = stream;
            const streamInfo = {
                title,
                gameName,
                startedAt: startDate,
                tags
            };
            return streamInfo;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error al obtener información del stream: ${error}`);
        return null;
    }
};

export const isChannelLive = async (channel) => {
    try {
        const stream = await HelixClient.streams.getStreamByUserName(channel);
        return !!stream;
    } catch (error) {
        console.error(`Error al verificar si el canal está en vivo: ${error}`);
        return false;
    }
}

export const getLiveChannels = async (channelList) => {
    // Si la lista de canales está vacía, no hay canales en vivo
    // Si la lista es muy grande, se divide en grupos de 100 canales (límite de la API de Twitch)
    
    if (channelList.length === 0) {
        return [];
    }

    const channelGroups = [];
    const groupSize = 100;
    const groupCount = Math.ceil(channelList.length / groupSize);

    for (let i = 0; i < groupCount; i++) {
        const channels = channelList.slice(i * groupSize, (i + 1) * groupSize);
        channelGroups.push(channels);
    }

    const liveChannels = [];

    for (const channels of channelGroups) {
        try {
            // Wait 10 seconds between each request to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 10000));
            const streams = await HelixClient.streams.getStreams({ userName: channels });
            for (const stream of streams.data) {
                liveChannels.push(stream);
            }
        } catch (error) {
            console.error(`Error al obtener los streams: ${error}`);
        }
    }

    return liveChannels;
};
