import "dotenv/config.js";
import { google } from 'googleapis';
import { Bot } from "../bot.js";
import Channel from "../app/models/Channel.js";
import { banUser, timeoutUser } from "../utils/twitch.js";
let DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';

export const analyzeToxify = async (message) => {
    try {
        const client = await google.discoverAPI(DISCOVERY_URL);
        const analyzeRequest = {
            comment: {
                text: message,
            },
            requestedAttributes: {
                TOXICITY: {},
            },
        };
        const response = await client.comments.analyze({
            key: process.env.PERSPECTIVE_KEY,
            resource: analyzeRequest,
        });
        return response.data;
    } catch (err) {
        return null
    }
}

export const handleDetoxify = async (channel, user, message, settings) => {
    const channelInfo = await Channel.getChannelByName(channel)
    const DetoxifyResult = await analyzeToxify(message)

            if (!DetoxifyResult) {
                console.info("INFO: Detoxify did not return a valid result, skipping moderation");
                return;
            }

            const toxicityThreshold = settings.detoxify_threshold || 0.6
            const toxicityValue = DetoxifyResult.attributeScores.TOXICITY.summaryScore.value


            if (toxicityValue > toxicityThreshold) {
                const timeoutDuration = settings.detoxify_timeout_time || 300
                const reason = `Detoxify: El mensaje tenía una alta probabilidad de ser tóxico (toxicidad: ${toxicityValue.toFixed(2)})`

                if (toxicityValue <= settings.detoxify_timeout_threshold || 0.8) {
                    // Si la toxicidad es menor o igual a 0.8, damos un tiempo de espera.
                    await timeoutUser(channelInfo.twitch_id, user["user-id"], timeoutDuration, reason);
                    Bot.say(channel, `@${user.username}, tu mensaje fue tóxico, ten más cuidado la próxima vez`)
                } else {
                    // Si la toxicidad es mayor que 0.8, prohibimos al usuario.
                    await banUser(channelInfo.twitch_id, user["user-id"], reason);
                    Bot.say(channel, `@${user.username}, tu mensaje fue extremadamente tóxico, te prohibimos temporalmente del chat`)
                }
            }
        }
    
