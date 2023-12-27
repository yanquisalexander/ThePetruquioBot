import { OpenAI } from "openai";
import Channel from "../models/Channel.model";
import Twitch from "./Twitch.module";
import User from "../models/User.model";

class StreamCopilot {
    private static instance: StreamCopilot | null = null;
    private openAI: OpenAI | null = null;
    private apiKey: string | undefined;

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    public static getInstance(): StreamCopilot {
        if (StreamCopilot.instance === null) {
            StreamCopilot.instance = new StreamCopilot();
        }

        return StreamCopilot.instance;
    }

    public initialize(): void {
        if (this.openAI !== null) {
            throw new Error("StreamCopilot is already initialized. Call getInstance() to get the instance.");
        }

        this.apiKey = process.env.OPENAI_API_KEY;

        if (!this.apiKey) {
            throw new Error("API key is missing. Set the OPENAI_API_KEY environment variable.");
        }

        this.openAI = new OpenAI({ apiKey: this.apiKey });
    }

    public getOpenAIInstance(): OpenAI {
        if (this.openAI === null) {
            throw new Error("StreamCopilot not initialized. Call initialize() first.");
        }

        return this.openAI;
    }

    /* We will support Function Calling from OpenAI, we define private methods here to use */

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
