import { FunctionDeclarationsTool } from "@google/generative-ai";
import { CopilotPlugins } from "./plugins";

export const CopilotFunctionDeclarations: FunctionDeclarationsTool['functionDeclarations'] = []

for (const plugin of Object.values(CopilotPlugins)) {
    // Instance a plugin to get the parameters
    const pluginInstance = new plugin()
    CopilotFunctionDeclarations.push({
        name: pluginInstance.name,
        description: pluginInstance.description,
        parameters: pluginInstance.getParameters(),
    })
}


/* const functionDeclarations: FunctionDeclarationsTool[] = [
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
                description: 'Send a message to the chat',
            },
            {
                name: FunctionsConst.searchOnWeb,
                description: 'Search on internet for a query',
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
                description: 'Get the current live channels on Twitch'
            },
            {
                name: FunctionsConst.suggestChannelToRaid,
                description: 'Suggest a channel to raid based on the current live channels',
            },
            {
                name: FunctionsConst.getSongRequestsQueue,
                description: 'Get the current song requests queue, from Streamer SongList',
            }
        ]
    }
] */

/* const FunctionsConst = {
    getChannelInfo: 'get_channel_info',
    changeStreamTitle: 'change_stream_title',
    toggleEmoteOnly: 'toggle_emote_only',
    clearChat: 'clear_chat',
    getCurrentSpotifySong: 'get_current_spotify_song',
    sendMessageToChat: 'send_message_to_chat',
    searchOnWeb: 'search_on_web',
    getCurrentLiveChannels: 'get_current_live_channels',
    suggestChannelToRaid: 'suggest_channel_to_raid',
    getSongRequestsQueue: 'get_song_requests_queue',
}
 */

/*         while (response.functionCalls()) {
                   for (const functionCalling of response.functionCalls() || []) {
                       switch (functionCalling.name) {
                           case FunctionsConst.searchOnWeb:
                               const { query } = functionCalling.args as { query: string };
                               const webResults = await Utils.googleSearch(query);
                               context.webResults = webResults;
                               response = await generate({
                                   functionCall: {
                                       name: FunctionsConst.searchOnWeb, response: { webResults }
                                   }
                               });
                               break;
       
                          
                         
       
                           case FunctionsConst.getChannelInfo:
                               const { channel: channelName } = functionCalling.args as { channel: string };
                               const searchResult = await Twitch.Helix.search.searchChannels(channelName);
                               const isSelfOnList = searchResult.data.some(c => c.id === channel.twitchId.toString());
                               const user = isSelfOnList ? await channel.user.fromHelix() as HelixUser : await searchResult.data[0].getUser();
                               const { description, displayName } = user;
                               const stream = await user.getStream();
                               const streamInfo = stream ? { title: stream.title, viewers: stream.viewers } : null;
                               const res = {
                                   description,
                                   displayName,
                                   stream: streamInfo,
                                   avatar: user.profilePictureUrl
                               };
                               context.twitchChannel = res;
                               response = await generate({
                                   functionCall: {
                                       name: FunctionsConst.getChannelInfo, response: res
                                   }
                               });
                               break;
       
                        
                           case FunctionsConst.sendMessageToChat:
                               // This function does not have args
                               const aiMessage = await generate({ modelResponse: response.text() });
                               await bot.sendMessage(channel, `/me ✨ Copilot: ${aiMessage.text()}`);
                               response = await generate({ functionCall: { name: FunctionsConst.sendMessageToChat, response: { success: true } } });
                               break;
       
                           case FunctionsConst.getCurrentLiveChannels:
                               const liveChannels = MemoryVariables.getLiveChannels();
                               response = await generate({
                                   functionCall: {
                                       name: FunctionsConst.getCurrentLiveChannels, response: {
                                           live_channels: liveChannels.map(stream => ({
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
                                           })),
                                       }
                                   }
                               });
                               break;
       
                           case FunctionsConst.suggestChannelToRaid:
                               const liveChannelsToRaid = MemoryVariables.getLiveChannels();
                               const randomChannel = liveChannelsToRaid[Math.floor(Math.random() * liveChannelsToRaid.length)];
       
                               if (!randomChannel) {
                                   response = await generate({ functionCall: { name: FunctionsConst.suggestChannelToRaid, response: { error: 'No live channels to raid' } } });
                                   break;
                               }
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
                               });
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
       
                           case FunctionsConst.getSongRequestsQueue:
                               const sslChannel = await StreamerSonglist.getChannel(channel.user.username);
       
                               if (!sslChannel) {
                                   response = await generate({ functionCall: { name: FunctionsConst.getSongRequestsQueue, response: { error: 'This channel does not have a Streamer SongList account' } } });
                                   break;
                               }
       
                               const queue = await sslChannel.getQueue();
                               context.actions?.push({ id: FunctionsConst.getSongRequestsQueue, args: { queue } });
                               response = await generate({
                                   functionCall: {
                                       name: FunctionsConst.getSongRequestsQueue, response: { queue }
                                   }
                               });
                               break;
                       }
       
                       // After each function call, add the response to the conversation history
                       // @ts-ignore
                       contents.push({ role: 'system', parts: [{ functionResponse: { name: functionCalling.name, response: functionCalling.response } }] });
                   }
               } */
