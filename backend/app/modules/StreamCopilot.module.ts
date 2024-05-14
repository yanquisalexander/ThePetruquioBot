import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, FunctionDeclarationsTool, FunctionDeclarationSchemaType, EnhancedGenerateContentResponse } from '@google/generative-ai';
import { Configuration } from "../config";
import Channel from "../models/Channel.model";
import User from "../models/User.model";
import Twitch from "./Twitch.module";
import { Bot } from "@/bot";
import { HelixUser } from "@twurple/api";
import { ExternalAccountProvider } from "../models/ExternalAccount.model";
import Utils, { getSpotifyCurrentlyPlayingSong } from "@/lib/Utils";
import MemoryVariables from "@/lib/MemoryVariables";

interface CopilotAction {
    id: string
    args?: any
}

interface CopilotSuggestedAction {
    id: string
    args?: any
    actions?: any[]
}

interface CopilotContextUsed {
    spotify: any | null
    webResults: any[] | null
    twitchChannel: any | null
    actions?: CopilotAction[]
    suggested_actions?: CopilotSuggestedAction[]
}


const MODEL_NAME = "gemini-1.5-pro-latest";

const BASE_SYSTEM_PROMPT = `
You are a Twitch chatbot named Petruquio.LIVE, created by @Alexitoo_UY.
Your duty is to entertain and inform users, and to help the streamer in question with smart features.

You can use emojis, mention users, and ask questions to the audience.
Respond as smoothly and naturally as possible.

Your are powered by Google Gemini.

Don't include links because you have TTS on and it will read them.

You can search on the internet to get more information.

DON'T send JSON responses.

--- Prompt personalizado impuesto por el streamer ---
`


const FunctionsConst = {
    getChannelInfo: 'getChannelInfo',
    changeStreamTitle: 'changeStreamTitle',
    toggleEmoteOnly: 'toggleEmoteOnly',
    clearChat: 'clearChat',
    getCurrentSpotifySong: 'getCurrentSpotifySong',
    sendMessageToChat: 'sendMessageToChat',
    searchOnWeb: 'searchOnInternet',
    getCurrentLiveChannels: 'getCurrentLiveChannels',
    suggestChannelToRaid: 'suggestChannelToRaid',
}

const functionDeclarations: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            {
                name: FunctionsConst.getChannelInfo,
                description: "Search for a channel on Twitch and get information about it, for example, the stream title, viewers, and description",
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        channel: { type: FunctionDeclarationSchemaType.STRING }
                    }
                }
            },
            {
                name: FunctionsConst.changeStreamTitle,
                description: 'Change the title of the stream',
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        title: { type: FunctionDeclarationSchemaType.STRING }
                    },
                    required: ['title']
                }
            },
            {
                name: FunctionsConst.toggleEmoteOnly,
                description: 'Toggle emote-only mode',
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        enabled: { type: FunctionDeclarationSchemaType.BOOLEAN }
                    },
                    required: ['enabled']
                }
            },
            {
                name: FunctionsConst.clearChat,
                description: 'Clear the chat',
            },
            {
                name: FunctionsConst.getCurrentSpotifySong,
                description: 'Get the current song that is playing on Spotify',
            },
            {
                name: FunctionsConst.sendMessageToChat,
                description: 'Send an AI-generated message to the chat using current context',
            },
            {
                name: FunctionsConst.searchOnWeb,
                description: 'Search on internet to provide more information about current context',
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        query: { type: FunctionDeclarationSchemaType.STRING }
                    },
                    required: ['query']
                }
            },
            {
                name: FunctionsConst.getCurrentLiveChannels,
                description: 'Get the current live channels on Twitch that have joined Petruquio.LIVE'
            },
            {
                name: FunctionsConst.suggestChannelToRaid,
                description: 'Suggest a channel to raid based on the current live channels',
            }
        ]
    }
]

class StreamCopilot {
    private googleGenerativeAI: GoogleGenerativeAI;
    private model: GenerativeModel

    constructor() {
        this.googleGenerativeAI = new GoogleGenerativeAI(Configuration.GOOGLE_GENERATIVE_AI_API_KEY);
        this.model = this.googleGenerativeAI.getGenerativeModel({
            model: MODEL_NAME,
            tools: functionDeclarations,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });
    }

    async generateText({ channel, user, prompt }: { channel: Channel, user: User, prompt: string }): Promise<{ response: EnhancedGenerateContentResponse, context: CopilotContextUsed }> {
        const bot = await Bot.getInstance();
        let context: CopilotContextUsed = { spotify: null, webResults: null, twitchChannel: null, actions: [], suggested_actions: [] };
        const generate = async ({ modelResponse, functionCall }: { modelResponse?: string, functionCall?: { name: string, response: any } }) => {
            // @ts-ignore
            this.model.systemInstruction = `
            ${BASE_SYSTEM_PROMPT}

            ${channel.preferences.smartAssistantPrompt.value}

            ---

            Current time (UTC): ${new Date().toUTCString()}
        
            Current channel: ${channel.user.displayName}
            Replying to: ${user.displayName}

            `

            const contents = [
                { role: 'user', parts: [{ text: prompt }] }
            ];
            if (modelResponse) contents.push({ role: 'model', parts: [{ text: modelResponse }] });
            // @ts-ignore
            if (functionCall) contents.push({ role: 'system', parts: [{ functionResponse: { name: functionCall.name, response: functionCall.response } }] });
            const { response } = await this.model.generateContent({ systemInstruction: this.model.systemInstruction, contents });
            return response;
        };

        let response = await generate({ modelResponse: prompt });

        console.log('Function calls:', response.functionCalls())

        while (response.functionCalls()) {
            for (const functionCalling of response.functionCalls() || []) {
                switch (functionCalling.name) {
                    case FunctionsConst.searchOnWeb:
                        const { query } = functionCalling.args as { query: string };
                        const webResults = await Utils.googleSearch(query);
                        context.webResults = webResults;
                        response = await generate({
                            functionCall: {
                                name: FunctionsConst.searchOnWeb, response: {
                                    webResults
                                }
                            }
                        });
                        break;
                    case FunctionsConst.getCurrentSpotifySong:
                        const spotifyAccount = await channel.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY)
                        if (!spotifyAccount) {
                            response = await generate({ functionCall: { name: FunctionsConst.getCurrentSpotifySong, response: { error: `No Spotify account linked` } } });
                            break;
                        }
                        const currentSong = await getSpotifyCurrentlyPlayingSong(channel)
                        context.spotify = currentSong;
                        response = await generate({ functionCall: { name: FunctionsConst.getCurrentSpotifySong, response: { currentSong } } });
                        break;
                    case FunctionsConst.changeStreamTitle:
                        const { title } = functionCalling.args as { title: string };
                        await channel.changeStreamTitle(title);
                        await bot.sendMessage(channel, `/me ✨ Copilot: Stream title changed to: ${title}`)
                        context.actions?.push({ id: FunctionsConst.changeStreamTitle, args: { title } })
                        response = await generate({ functionCall: { name: FunctionsConst.changeStreamTitle, response: { success: true, title } } });
                        break;
                    case FunctionsConst.getChannelInfo:
                        const { channel: channelName } = functionCalling.args as { channel: string };
                        const searchResult = await Twitch.Helix.search.searchChannels(channelName);
                        const isSelfOnList = searchResult.data.some(c => c.id === channel.twitchId.toString());
                        const user = isSelfOnList ? await channel.user.fromHelix() as HelixUser : await searchResult.data[0].getUser();
                        const { description, displayName } = user
                        const stream = await user.getStream();
                        const streamInfo = stream ? { title: stream.title, viewers: stream.viewers } : null;
                        const res = {
                            description,
                            displayName,
                            stream: streamInfo,
                            avatar: user.profilePictureUrl
                        }
                        context.twitchChannel = res;
                        response = await generate({
                            functionCall: {
                                name: FunctionsConst.getChannelInfo, response: res
                            }
                        });
                        break;
                    case FunctionsConst.toggleEmoteOnly:
                        const { enabled } = functionCalling.args as { enabled: boolean };
                        await channel.toggleEmoteOnly(enabled);
                        await bot.sendMessage(channel, `/me ✨ Copilot: Emote-only mode ${enabled ? 'enabled' : 'disabled'}`)
                        context.actions?.push({ id: FunctionsConst.toggleEmoteOnly, args: { enabled } })
                        response = await generate({ functionCall: { name: FunctionsConst.toggleEmoteOnly, response: { success: true } } });
                        break;
                    case FunctionsConst.clearChat:
                        await channel.clearChat();
                        await bot.sendMessage(channel, `/me ✨ Copilot: Chat cleared`)
                        context.actions?.push({ id: FunctionsConst.clearChat })
                        response = await generate({ functionCall: { name: FunctionsConst.clearChat, response: { success: true } } });
                        break;
                    case FunctionsConst.sendMessageToChat:
                        // this function don't have args
                        const aiMessage = await generate({ modelResponse: response.text() });
                        await bot.sendMessage(channel, `/me ✨ Copilot: ${aiMessage.text()}`)
                        response = await generate({ functionCall: { name: FunctionsConst.sendMessageToChat, response: { success: true } } });
                        break;
                    case FunctionsConst.getCurrentLiveChannels:
                        const liveChannels = MemoryVariables.getLiveChannels();
                        response = await generate({
                            functionCall: {
                                name: FunctionsConst.getCurrentLiveChannels, response: {
                                    live_channels: liveChannels.map(stream => {
                                        return {
                                            username: stream.userName,
                                            display_name: stream.userDisplayName,
                                            title: stream.title,
                                            viewers: stream.viewers,
                                            thumbnail_url: stream.thumbnailUrl,
                                            started_at: stream.startDate,
                                            language: stream.language,
                                            tags: stream.tags,
                                            game_id: stream.gameId,
                                            game_name: stream.gameName,
                                            type: stream.type,
                                            is_mature: stream.isMature,
                                        }
                                    }),
                                }
                            }
                        });
                        break;
                    case FunctionsConst.suggestChannelToRaid:
                        const liveChannelsToRaid = MemoryVariables.getLiveChannels();
                        const randomChannel = liveChannelsToRaid[Math.floor(Math.random() * liveChannelsToRaid.length)];
                        context.suggested_actions?.push({
                            id: FunctionsConst.suggestChannelToRaid, args: {
                                channel: {
                                    display_name: randomChannel.userDisplayName || randomChannel.userName,
                                    title: randomChannel.title,
                                    viewers: randomChannel.viewers,
                                    started_at: randomChannel.startDate,
                                    language: randomChannel.language,
                                    game_name: randomChannel.gameName,
                                    thumbnail_url: randomChannel.getThumbnailUrl(440, 248),
                                }
                            }
                        })
                        response = await generate({
                            functionCall: {
                                name: FunctionsConst.suggestChannelToRaid, response: {
                                    suggested_channel: {
                                        username: randomChannel.userName,
                                        display_name: randomChannel.userDisplayName,
                                        title: randomChannel.title,
                                        viewers: randomChannel.viewers,
                                        thumbnail_url: randomChannel.thumbnailUrl,
                                        started_at: randomChannel.startDate,
                                        language: randomChannel.language,
                                        tags: randomChannel.tags,
                                        game_id: randomChannel.gameId,
                                        game_name: randomChannel.gameName,
                                        type: randomChannel.type,
                                        is_mature: randomChannel.isMature,
                                    }
                                }
                            }
                        });
                        break;
                }
            }
        }

        return { response, context };
    }
}

export const streamCopilot = new StreamCopilot();
