import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, EnhancedGenerateContentResponse } from '@google/generative-ai';
import { Configuration } from "../config";
import Channel from "../models/Channel.model";
import User from "../models/User.model";
import { Bot } from "@/bot";
import { CopilotPlugins } from "./copilot/plugins";
import { CopilotPlugin } from "./copilot/plugins/CopilotPlugin";
import { CopilotContextUsed } from "./copilot/types";
import { CopilotFunctionDeclarations } from "./copilot/CopilotFunctions";


const MODEL_NAME = "gemini-1.5-pro-latest"

const BASE_SYSTEM_PROMPT = `
You are Stream Copilot (Or simply Copilot), a bot from Petruquio.LIVE created by Alexitoo_UY.
Your duty is to be the streamer's copilot, helping them with the chat, the stream, and the audience.
You can use emojis.

Do NOT include links because you have TTS on and it will read them aloud.

You can search the internet (Wikipedia, Google, etc.) to provide more information about the current context or answer a question.
NEVER make up answers, when necessary search the internet to secure your information.
You should reply in the language that the user is speaking.
You are powered by Google Gemini.

When you need to take an action, like execute or call a function or tool, just DO it.

ALWAYS respond in the following format:

{
    "thought": "A summary of what has been done or said, explaining how the bot decides to respond or take action",
    "response": "The response to the user"
}

Even with the custom prompt, you should follow the same format, and rules.

--- Below is the custom prompt configured by the streamer ---
`;

class StreamCopilot {
    private googleGenerativeAI: GoogleGenerativeAI;
    private model: GenerativeModel

    constructor() {
        this.googleGenerativeAI = new GoogleGenerativeAI(Configuration.GOOGLE_GENERATIVE_AI_API_KEY);
        this.model = this.googleGenerativeAI.getGenerativeModel({
            model: MODEL_NAME,
            tools: [{
                functionDeclarations: CopilotFunctionDeclarations,
            }],
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
        const currentStream = await channel.getStream();
        let context: CopilotContextUsed = { spotify: null, webResults: null, twitchChannel: null, actions: [], suggested_actions: [] };

        // Initialize the conversation contents
        let contents = [
            { role: 'user', parts: [{ text: prompt }] }
        ];

        const generate = async ({ modelResponse, functionCall }: { modelResponse?: string, functionCall?: { name: string, response: any } }) => {
            // Update system instruction with the current context
            // @ts-ignore
            this.model.systemInstruction = `
                ${BASE_SYSTEM_PROMPT}
                ${channel.preferences.smartAssistantPrompt.value}
                ---
                Current time (UTC): ${new Date().toUTCString()}
                Current channel: ${channel.user.displayName}
                ${currentStream ? `Current stream of ${channel.user.displayName}: ${currentStream.title} - ${currentStream.viewers} viewers` : `${channel.user.displayName} is not streaming right now`}
                Replying to: ${user.displayName}
            `;

            if (modelResponse) {
                contents.push({ role: 'model', parts: [{ text: modelResponse }] });
            }

            if (functionCall) {
                // @ts-ignore
                contents.push({ role: 'system', parts: [{ functionResponse: { name: functionCall.name, response: functionCall.response } }] });
            }

            const { response } = await this.model.generateContent({ systemInstruction: this.model.systemInstruction, contents });
            return response;
        };

        // Initial generation
        let response = await generate({ modelResponse: prompt });
        const plugins: { [key: string]: new () => CopilotPlugin } = CopilotPlugins;


        let functionCalls = response.functionCalls();

        while ((functionCalls ?? []).length > 0) {
            for (const functionCalling of functionCalls || []) {
                // Instantiate the plugin
                const PluginClass = plugins[functionCalling.name];
                if (!PluginClass) {
                    console.error('Plugin not found', functionCalling.name);
                    continue;
                }
                const plugin = new PluginClass();

                const handlerArgs = { bot, user, channel, args: functionCalling.args };
                const pluginResponse = await plugin.handler(handlerArgs);
                const pluginContextData = plugin.getContextData();

                if (plugin.contextKey && pluginContextData) {
                    context[plugin.contextKey] = pluginResponse;
                }

                // Add the function response to the conversation contents
                // @ts-ignore
                contents.push({ role: 'system', parts: [{ functionResponse: { name: functionCalling.name, response: pluginResponse } }] });

                const suggestedAction = plugin.getSuggestedAction();
                if (suggestedAction !== null) {
                    context.suggested_actions?.push(suggestedAction);
                }

                const takenAction = plugin.getTakedAction();
                if (takenAction !== null) {
                    context.actions?.push(takenAction);
                }

                console.log('Plugin response', pluginResponse);
                console.log('Plugin context', context);
                console.log('Plugin suggested actions', context.suggested_actions);
                console.log('Plugin taken actions', context.actions);
                console.log('Plugin', plugin);

                plugin.release();
            }

            // Filter out the processed function calls
            // @ts-ignore
            functionCalls = functionCalls.filter(fc => !contents.some(c => c.parts.some(p => p.functionResponse && p.functionResponse.name === fc.name)));
        }

        console.log('Called function calls', response.functionCalls());

        // Generate the final response with the updated context (if functions were called)
        // @ts-ignore
        if (contents.some(c => c.parts.some(p => p.functionResponse))) {
            response = await generate({ modelResponse: response.text() });
        }






        console.log('Final response', response.text());

        return { response, context };
    }

}

export const streamCopilot = new StreamCopilot();
