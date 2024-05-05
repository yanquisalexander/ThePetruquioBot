import { NuxtAuthHandler } from '#auth'
import axios from 'axios';
import { API_ENDPOINT } from '~/utils/constants';

export default NuxtAuthHandler({
    secret: process.env.SECRET,
    callbacks: {
        jwt: async ({ token, user, account }) => {
            return { ...token, ...user, ...account };
        },
        session: async ({ session, token, user }) => {
            let oldToken = token;
            let oldSession = session;
            if (process.env.NODE_ENV === 'development') {
                console.log(`Fetching user session: ${token.username}`);
            }
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token.token;
            let url = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/v2/accounts/session' : 'https://api.petruquio.live/v2/accounts/session';
            try {
                const response = await axios.get(url);
                session.user = response.data.user;
                if (!session.user) {
                    throw new Error('Failed to fetch user session from Database');
                }
                // @ts-ignore
                session.user.token = token.token;
            } catch (error) {
                console.error('Failed to fetch user session from Database');
                console.error((error as Error).message);
                // Re-use the old session if the new one fails (Try to fetch current session later)
                // Possible causes: Database is down, Api is down, etc.
                session = oldSession;
                // session.user = oldSession.user;
                // @ts-ignore
                session.user.token = oldToken.token;
                return session;
            }

            return session;
        },

    },
    providers: [
        {
            id: 'twitch',
            name: 'Twitch',
            type: 'oauth',
            version: '2.0',
            idToken: false,
            authorization: {
                url: `${API_ENDPOINT}/accounts/login`,
            },
            token: {
                request: async (e) => {
                    let url = `${API_ENDPOINT}/accounts/token`;
                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                code: e.params.code
                            })
                        });

                        if (!response.ok) {
                            throw new Error('Error al obtener tokens');
                        }

                        const data = await response.json();
                        return { tokens: data };
                    } catch (error) {
                        console.error(error);
                        throw new Error('Error al recuperar el token de acceso de Twitch');
                    }
                }
            },
            userinfo: {
                request: async (context) => {
                    let url = `${API_ENDPOINT}/accounts/me`;
                    try {
                        const response = await axios.get(url, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + context.tokens.token
                            },
                        });
                        return response.data.user;
                    } catch (error) {
                        console.error((error as Error).message);
                        throw new Error('Failed to fetch user information from Database');
                    }
                }
            },

            profile: (profile) => {
                return {
                    id: profile.twitchId,
                    username: profile.username,
                    name: profile.displayName,
                    avatar: `https://decapi.me/twitch/avatar/${profile.username}`,
                    email: profile.email,
                    admin: profile.admin,
                };
            },
            // We don't provide clientId because the backend handle the authorization url
            clientId: 'PETRUQUIOLIVE',
        }
    ]
})