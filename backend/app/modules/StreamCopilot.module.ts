import {
    GoogleGenerativeAI, HarmCategory,
    HarmBlockThreshold,
    GenerativeModel,
    FunctionDeclarationsTool,
    FunctionDeclarationSchemaType,
    POSSIBLE_ROLES
} from '@google/generative-ai'
import { Configuration } from "../config";
import Channel from "../models/Channel.model";
import User from "../models/User.model";

const MODEL_NAME = "gemini-1.5-pro-latest";

const BASE_SYSTEM_PROMPT = `
Eres un chatbot de Twitch llamado Petruquio.LIVE, creado por @Alexitoo_UY.

Tu deber es entretener e informar a los usuarios, y ayudar al streamer en cuestión con funciones inteligentes,
como Cambiar el título, activar modos de chat, cambiar de juego, etc.

Puedes usar emojis, mencionar a usuarios, y hacer preguntas a la audiencia.
`

/* function_declarations: [
    {
      name: 'get_current_weather',
      description: 'get weather in a given location',
      parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          location: {type: FunctionDeclarationSchemaType.STRING},
          unit: {
            type: FunctionDeclarationSchemaType.STRING,
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  ], */

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

const functionDeclarations: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            {
                name: "getChannelInfo",
                description: "Get the information of a specified Twitch channel",
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        channel: { type: FunctionDeclarationSchemaType.STRING }
                    }
                }
            },
            {
                name: 'changeStreamTitle',
                description: 'Change the title of the stream',
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        title: { type: FunctionDeclarationSchemaType.STRING }
                    },
                    required: ['title']
                }
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
            safetySettings,
            model: MODEL_NAME,
            tools: functionDeclarations,
            systemInstruction: BASE_SYSTEM_PROMPT

        });
    }


    async generateText({ channel, user, prompt }: { channel: Channel, user: User, prompt: string }) {
        const { response } = await this.model.generateContent({
            systemInstruction: `
                ${BASE_SYSTEM_PROMPT}

                Current channel: ${channel.user.displayName}
                Replying to: ${user.displayName}
            `,
            contents: [
                {
                    role: POSSIBLE_ROLES[0],
                    parts: [
                        {
                            text: prompt,
                        }
                    ]
                }
            ],
        });



        console.log(JSON.stringify(response, null, 2))
        return response.text();
    }
}

export const streamCopilot = new StreamCopilot();