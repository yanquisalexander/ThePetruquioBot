import Pusher from 'pusher-js';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

export class KMI {
    constructor(channels = [], token) {
        this.channels = channels;
        this.pusher = null;
        this.token = token;

        // Crear una jarra de cookies
        this.cookieJar = new CookieJar();
        // Configurar Axios para usar la jarra de cookies
        this.apiClient = wrapper(axios.create({
            jar: this.cookieJar,
            baseURL: 'https://kick.com',
            headers: {
                Accept: 'application/json',
                Authorization: this.token ? `Bearer ${this.token}` : null,
                'Set-Cookie': 'kick_session=rNf00aDKkrnkahwgRQW1V78xeFssEhiItwE6MbMy; expires=Thu, 03-Aug-2023 19:38:26 GMT; Max-Age=2592000; path=/; domain=kick.com; httponly; samesite=lax'
            },
        }));
    }

    async say(chatroomId, message) {
        console.log(chatroomId, message);
        console.log(`Bearer ${this.token}`);
        const messageBody = {
            chatroom_id: chatroomId,
            message: message,
        };
        console.log(messageBody);
        try {
            const response = await this.apiClient.post(
                'https://kick.com/api/v1/chat-messages',
                messageBody
            );

            if (response.status === 200) {
                const sendMessage = response.data;
                return sendMessage;
            } else {
                console.error('Error:', response.status, response.statusText);
                return null;
            }
        } catch (error) {
            console.error(error);
            return error;
        }
    }


    connect() {
        this.pusher = new Pusher('eb1d5f283081a78b932c', {
            cluster: 'us2',
        });

        this.pusher.connection.bind('connected', () => {
            console.log('Connected to Pusher');
            this.joinChannels();
        });

        this.pusher.connection.bind('disconnected', () => {
            console.log('Disconnected from Pusher');
        });

        this.pusher.connection.bind('error', (error) => {
            console.error('Pusher error:', error);
        });

        this.pusher.connection.bind('state_change', (states) => {
            console.log('Pusher state change:', states.current);
        });

        this.pusher.connection.connect();
    }

    joinChannels() {
        this.channels.forEach((channelName) => {
            const channel = this.pusher.subscribe(`chatrooms.${channelName}.v2`);
            channel.bind('App\\Events\\ChatMessageEvent', (data) => {
                this.handleMessage(data);
            });
        });
    }

    join(channelName) {
        const channel = this.pusher.subscribe(`chatrooms.${channelName}.v2`);
        channel.bind('App\\Events\\ChatMessageEvent', (data) => {
            this.handleMessage(data);
        });
    }

    handleMessage(data) {
        // Implementa la lógica para manejar los mensajes recibidos
    }

    disconnect() {
        if (this.pusher) {
            this.channels.forEach((channelName) => {
                this.pusher.unsubscribe(`chatrooms.${channelName}.v2`);
            });
            this.pusher.disconnect();
        }
    }
}
