import { OpenAI } from "openai";
import chalk from "chalk";
import Twitch from "./Twitch.module";
import Channel from "../models/Channel.model";
import User from "../models/User.model";
import axios from "axios";
import { ChatCompletionTool } from "openai/resources";

const Tools : ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      },
    },
  ];


class StreamCopilot {
    private static instance: StreamCopilot | null = null;
    private static openAI: OpenAI | null = null;
    private static apiKey: string | undefined;

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    public static getInstance(): StreamCopilot {
        if (StreamCopilot.instance === null) {
            StreamCopilot.instance = new StreamCopilot();
        }

        return StreamCopilot.instance;
    }

    public static initialize(apiKey: string): void {
        if (this.openAI !== null) {
            throw new Error("StreamCopilot is already initialized. Call getInstance() to get the instance.");
        }

        if (!apiKey) {
            throw new Error("API key is missing.");
        }

        this.apiKey = apiKey;

        this.openAI = new OpenAI({
            apiKey: this.apiKey,
            baseURL: 'https://api.shuttleai.app/v1/'
        });

        console.log(chalk.green("[StreamCopilot]"), chalk.white("Initialized"));
    }

    public getOpenAIInstance(): OpenAI {
        if (StreamCopilot.openAI === null) {
            throw new Error("StreamCopilot not initialized. Call initialize() first.");
        }

        return StreamCopilot.openAI;
    }

    public async generateResponse(input: string, user: User, channel: Channel): Promise<string> {
        const initTime = Date.now();
        const response = await this.getOpenAIInstance().chat.completions.create({
            model: 'gpt-3.5-turbo-0613',
            stream: false,
            temperature: 0.9,
            messages: [
                {
                    role: 'system',
                    content: channel.preferences.smartAssistantPrompt?.value || 'Hola, soy tu asistente personal PetruquioBot. ¿En qué puedo ayudarte?'
                },
                {
                    role: 'user',
                    content: input
                },
            ],
            user: `petruquiouser-${user.twitchId}`,
            tool_choice: 'auto',
            tools: Tools,
        });

        console.log(chalk.green("[StreamCopilot]"), chalk.white(`Generated response in ${Date.now() - initTime}ms`));

        console.log(response.choices[0]);

        return response.choices[0].message.content as string;
    }

    private async changeStreamTitle(streamTitle: string, channel: Channel): Promise<string> {
        try {
            await Twitch.Helix.channels.updateChannelInfo(channel.twitchId, {
                title: streamTitle,
            });
            return "Stream title changed to " + streamTitle;
        } catch (error) {
            return "Error changing stream title: " + error;
        }
    }

}

export default StreamCopilot;
