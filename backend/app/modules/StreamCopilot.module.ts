import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, FunctionDeclarationsTool, FunctionDeclarationSchemaType, EnhancedGenerateContentResponse } from '@google/generative-ai';
import { Configuration } from "../config";
import Channel from "../models/Channel.model";
import User from "../models/User.model";
import Twitch from "./Twitch.module";
import { Bot } from "@/bot";
import { HelixUser } from "@twurple/api";
import { ExternalAccountProvider } from "../models/ExternalAccount.model";
import Utils, { getSpotifyCurrentlyPlayingSong } from "@/lib/Utils";

const MODEL_NAME = "gemini-1.5-pro-latest";

const BASE_SYSTEM_PROMPT = `
Eres un chatbot de Twitch llamado Petruquio.LIVE, creado por @Alexitoo_UY.

Tu deber es entretener e informar a los usuarios, y ayudar al streamer en cuestión con funciones inteligentes.

Puedes usar emojis, mencionar a usuarios, y hacer preguntas a la audiencia.

Responde de la manera más fluida y natural posible.

Your are powered by Google Gemini.

--- Prompt personalizado impuesto por el streamer ---
`


const FunctionsConst = {
    getChannelInfo: 'getChannelInfo',
    changeStreamTitle: 'changeStreamTitle',
    toggleEmoteOnly: 'toggleEmoteOnly',
    clearChat: 'clearChat',
    getCurrentSpotifySong: 'getCurrentSpotifySong',
    sendMessageToChat: 'sendMessageToChat'
}

const functionDeclarations: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            {
                name: FunctionsConst.getChannelInfo,
                description: "Get the information of a specified Twitch channel",
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
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {},
                    required: []
                }
            },
            {
                name: FunctionsConst.getCurrentSpotifySong,
                description: 'Get the current song playing on Spotify'
            },
            {
                name: FunctionsConst.sendMessageToChat,
                description: 'Send an AI-generated message to the chat using current context',
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

    async generateText({ channel, user, prompt }: { channel: Channel, user: User, prompt: string }): Promise<EnhancedGenerateContentResponse> {
        const bot = await Bot.getInstance();
        const generate = async ({ modelResponse, functionCall }: { modelResponse?: string, functionCall?: { name: string, response: any } }) => {
            // @ts-ignore
            this.model.systemInstruction = `
            ${BASE_SYSTEM_PROMPT}

            ${channel.preferences.smartAssistantPrompt.value}

            ---
            
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

        while (response.functionCalls()) {
            for (const functionCalling of response.functionCalls() || []) {
                switch (functionCalling.name) {
                    case FunctionsConst.changeStreamTitle:
                        const { title } = functionCalling.args as { title: string };
                        await channel.changeStreamTitle(title);
                        await bot.sendMessage(channel, `/me ✨ Copilot: Stream title changed to: ${title}`)
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

                        response = await generate({
                            functionCall: {
                                name: FunctionsConst.getChannelInfo, response: {
                                    description,
                                    displayName,
                                    stream: streamInfo
                                }
                            }
                        });
                        break;
                    case FunctionsConst.toggleEmoteOnly:
                        const { enabled } = functionCalling.args as { enabled: boolean };
                        await channel.toggleEmoteOnly(enabled);
                        await bot.sendMessage(channel, `/me ✨ Copilot: Emote-only mode ${enabled ? 'enabled' : 'disabled'}`)
                        response = await generate({ functionCall: { name: FunctionsConst.toggleEmoteOnly, response: { success: true } } });
                        break;
                    case FunctionsConst.clearChat:
                        await channel.clearChat();
                        await bot.sendMessage(channel, `/me ✨ Copilot: Chat cleared`)
                        response = await generate({ functionCall: { name: FunctionsConst.clearChat, response: { success: true } } });
                        break;
                    case FunctionsConst.getCurrentSpotifySong:
                        const spotifyAccount = await channel.user.getLinkedAccount(ExternalAccountProvider.SPOTIFY)
                        if (!spotifyAccount) {
                            response = await generate({ functionCall: { name: FunctionsConst.getCurrentSpotifySong, response: { error: `No Spotify account linked` } } });
                            break;
                        }
                        const currentSong = await getSpotifyCurrentlyPlayingSong(channel)
                        response = await generate({ functionCall: { name: FunctionsConst.getCurrentSpotifySong, response: { currentSong } } });
                        break;
                    case FunctionsConst.sendMessageToChat:
                        // this function don't have args
                        const aiMessage = await generate({ modelResponse: response.text() });
                        await bot.sendMessage(channel, `/me ✨ Copilot: ${aiMessage.text()}`)
                        response = await generate({ functionCall: { name: FunctionsConst.sendMessageToChat, response: { success: true } } });
                        break;
                }
            }
        }

        return response
    }
}

export const streamCopilot = new StreamCopilot();
