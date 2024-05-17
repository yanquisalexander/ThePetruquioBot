import { FunctionDeclarationSchema, FunctionDeclarationSchemaType } from "@google/generative-ai";
import { CopilotPlugin, HandlerArgs } from "./CopilotPlugin";
import { CopilotAction, CopilotSuggestedAction } from "../types";

const TWITCH_ACTIONS = {
    CLEAR_CHAT: 'clearChat',
    CHANGE_TITLE: 'changeStreamTitle',
    EMOTE_ONLY: 'emoteOnly',
    SEND_MESSAGE_TO_CHAT: 'sendMessageToChat'
};

export class TwitchPlugin extends CopilotPlugin {
    name = "twitch";
    description = `
        Copilot plugin to interact with Twitch API.

        This plugin can:
        - Clear the chat
        - Change the title of the stream
        - Toggle the emote-only mode
        - Send a message to the chat

        Copilot should understand the intent of the user and pass the correct arguments to the plugin.
        For example, if the user says "Clear the chat", Copilot should call the plugin with the arguments { action: 'clearChat' }.
    `;
    version = "1.0.0";
    enabled = true;
    icon = "fa6-brands-twitch";
    contextKey = 'twitch';
    private takedAction: CopilotAction | null = null;
    private suggestedAction: CopilotSuggestedAction | null = null;
    private contextData: any = null;

    async handler(data: HandlerArgs): Promise<any> {
        console.log('TwitchPlugin.handler', data);
        const { user, channel, bot } = data;
        const { action, title, emoteOnly, message } = data.args;

        switch (action) {
            case TWITCH_ACTIONS.CLEAR_CHAT:
                await data.channel.clearChat();
                this.takedAction = { id: TWITCH_ACTIONS.CLEAR_CHAT };
                await bot.sendMessage(channel, `/me ✨ Copilot: Chat cleared`);
                break;

            case TWITCH_ACTIONS.CHANGE_TITLE:
                await data.channel.changeStreamTitle(title);
                this.takedAction = { id: TWITCH_ACTIONS.CHANGE_TITLE, args: { title } };
                await bot.sendMessage(channel, `/me ✨ Copilot: Stream title changed to: ${title}`);
                break;
            case TWITCH_ACTIONS.EMOTE_ONLY:
                await data.channel.toggleEmoteOnly(emoteOnly);
                this.takedAction = { id: TWITCH_ACTIONS.EMOTE_ONLY, args: { enabled: emoteOnly } };
                await bot.sendMessage(channel, `/me ✨ Copilot: Emote-only mode ${emoteOnly ? 'enabled' : 'disabled'}`);
                break;
            case TWITCH_ACTIONS.SEND_MESSAGE_TO_CHAT:
                await bot.sendMessage(channel, message);
                this.takedAction = { id: TWITCH_ACTIONS.SEND_MESSAGE_TO_CHAT, args: { message } };
                break;

            default:
                return { error: 'Unknown action' };
        }

        return { action, title, success: true };
    }


    getParameters(): FunctionDeclarationSchema {
        return {
            type: FunctionDeclarationSchemaType.OBJECT,
            required: ["action"],
            properties: {
                action: {
                    type: FunctionDeclarationSchemaType.STRING,
                    enum: Object.values(TWITCH_ACTIONS),
                    description: `
                        The action to take. Possible values:
                        ${Object.values(TWITCH_ACTIONS).join(', ')}
                    `
                },
                title: {
                    type: FunctionDeclarationSchemaType.STRING,
                    description: "The new title of the stream"
                },
                emoteOnly: {
                    type: FunctionDeclarationSchemaType.BOOLEAN,
                    description: "Whether to enable or disable the emote-only mode"
                },
                message: {
                    type: FunctionDeclarationSchemaType.STRING,
                    description: "The message to send to the chat"
                }
            }
        };
    }

    getSuggestedAction() {
        return this.suggestedAction || null;
    }

    getTakedAction() {
        return this.takedAction || null;
    }

    getContextData() {
        return this.contextData;
    }
}
