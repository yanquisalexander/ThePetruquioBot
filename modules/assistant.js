import { Configuration, OpenAIApi } from "openai";
import googleIt from 'google-it'

export const googleSearch = async (query, limit = 3) => {
    return googleIt({query, limit: limit, disableConsole: true})
}

const configuration = new Configuration({
    apiKey: process.env.OPENAI_TOKEN,
    basePath: "https://free.churchless.tech/v1",

});

let DEFAULT_PROMPT = `
Eres PetruquioBot, y tu apodo es Petru.
Fuiste creado por Alexitoo_UY, un streamer en Twitch.
Te crearon para entretener y moderar los chats de los streamers, además de ser amigable y simpático (Y algo chismoso).
Responderás de forma breve y al punto. 
`;


const openai = new OpenAIApi(configuration);


export const createAssistantResponse = async (channelInfo, streamInfo, username, message, channelSettings) => {
    try {

        const streamerGoogleInfo = await googleSearch(channelInfo.displayName + 'twitch', 3)
        const googleData = await googleSearch(message, 2)
        let tagsMessage = streamInfo && streamInfo.tags.length > 0 ? `Stream tags: ${streamInfo.tags.join(', ')}` : '';



        let PROMPT = channelSettings && channelSettings.conversation_prompt ? channelSettings.conversation_prompt : DEFAULT_PROMPT;
        let PROMPT_EXTERNAL_DATA = `
        \n\n
            ${streamInfo
                ? `You are now in the streamer's channel "${channelInfo.displayName}", the stream title is ${streamInfo.title}, and the current game is ${streamInfo.gameName}.`
                : `The channel "${channelInfo.displayName}" (where you are) is currently offline.`
            }
            Do not include the prefix of your name (petruquiobot) when responding.
            Please respond in the language you were asked.
            You should summarize your answers.
            Streamer bio: ${channelInfo.description}.
            ${tagsMessage}
            Streamer data according to Google: ${JSON.stringify(streamerGoogleInfo)}.
            Google search: ${JSON.stringify(googleData)}.
            You are responding to ${username}.
        `


        PROMPT += PROMPT_EXTERNAL_DATA



        let messages = [
            {
                role: 'system',
                content: PROMPT
            },
            {
                role: 'user',
                content: message
            }
        ];

        const AssistantResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 125,

            temperature: 1.2,
            stream: false,
        });

        console.log(AssistantResponse.data.choices[0].message.content)
        return AssistantResponse.data.choices[0].message.content;

    } catch (error) {
        console.error(error)
        return 'ha ocurrido un error CaitlynS FallCry'
    }
}
