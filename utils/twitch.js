import { ApiClient } from '@twurple/api';
import { getAccessToken, authProvider, appTokenProvider } from '../lib/twitch-auth.js';
import { EventSubWsListener } from '@twurple/eventsub-ws';

export const AppClient = new ApiClient({
    authProvider: appTokenProvider
});

export const HelixClient = new ApiClient({
    authProvider
});

export const isFollower = async (username, channel) => {
    return true;
}

export const knownBots = ["streamelements", "streamlabs", "nightbot"];





export const getChannelInfo = async (channelName) => {
    try {
        const user = await HelixClient.users.getUserByName(channelName);
        return user;
    } catch (error) {
        console.error(`Error al obtener la información del broadcaster: ${error}`);
        return null;
    }
};

export const timeoutUser = async (channelID, userID, duration, reason) => {
    try {
        const response = await HelixClient.moderation.timeoutUser(channelID, userID, duration, reason);
        return response;
    } catch (error) {
        console.error(`No se puede dar timeout: ${error}`);
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
