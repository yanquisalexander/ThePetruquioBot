import { RefreshingAuthProvider, AppTokenAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import dotenv from 'dotenv';
import { db } from './database.js';
import UserToken from '../app/models/UserToken.js';
import User from '../app/models/User.js';

dotenv.config();

const twitchScopes = [
    'analytics:read:extensions',
    'user:edit',
    'user:read:email',
    'clips:edit',
    'bits:read',
    'analytics:read:games',
    'user:edit:broadcast',
    'user:read:broadcast',
    'chat:read',
    'chat:edit',
    'channel:moderate',
    'channel:read:subscriptions',
    'whispers:read',
    'whispers:edit',
    'moderation:read',
    'channel:read:redemptions',
    'channel:edit:commercial',
    'channel:read:hype_train',
    'channel:read:stream_key',
    'channel:manage:extensions',
    'channel:manage:broadcast',
    'user:edit:follows',
    'channel:manage:redemptions',
    'channel:read:editors',
    'channel:manage:videos',
    'user:read:blocked_users',
    'user:manage:blocked_users',
    'user:read:subscriptions',
    'user:read:follows',
    'channel:manage:polls',
    'channel:manage:predictions',
    'channel:read:polls',
    'channel:read:predictions',
    'moderator:manage:automod',
    'channel:manage:schedule',
    'channel:read:goals',
    'moderator:read:automod_settings',
    'moderator:manage:automod_settings',
    'moderator:manage:banned_users',
    'moderator:read:blocked_terms',
    'moderator:manage:blocked_terms',
    'moderator:read:chat_settings',
    'moderator:manage:chat_settings',
    'channel:manage:raids',
    'moderator:manage:announcements',
    'moderator:manage:chat_messages',
    'user:manage:chat_color',
    'channel:manage:moderators',
    'channel:read:vips',
    'channel:manage:vips',
    'user:manage:whispers',
    'channel:read:charity',
    'moderator:read:chatters',
    'moderator:read:shield_mode',
    'moderator:manage:shield_mode',
    'moderator:read:shoutouts',
    'moderator:manage:shoutouts',
    'moderator:read:followers'
];

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const twitchUserId = process.env.TWITCH_USER_ID;

let tokenData = {};

export const appTokenProvider = new AppTokenAuthProvider(clientId, clientSecret, twitchScopes)

// Crea una instancia del proveedor de autenticación
export const authProvider = new RefreshingAuthProvider({
  clientId,
  clientSecret,
  onRefreshFailure: async () => {
    // Función que se ejecuta al fallar al actualizar el token de acceso
    console.log('Error al actualizar el token de acceso');
  },
  onRefresh: async (userId, newTokenData) => {
    // Función que se ejecuta al actualizar el token de acceso
    await writeToken(userId, newTokenData);
  },
});


// Función para escribir el token de un usuario en la base de datos
async function writeToken(userId, tokenData) {
  console.log(`Escribiendo token para el usuario ${userId}`);
  try {
    const cachedUser = await User.findByTwitchId(userId)
    await UserToken.update(cachedUser.id, tokenData);
  } catch (error) {
    console.log(`Error al escribir el token para el usuario ${userId}:`, error);
  }
}



// Inicializa la autenticación
export const initializeAuth = async () => {
  console.log('Inicializando autenticación');
  let userTokens = await UserToken.getAll()
  userTokens.forEach(async token => {
    if (!token.token_data) {
      return;
    }
    const cachedUser = await User.findById(token.user_id)
    if (cachedUser) {
      console.log(`Añadiendo token para el usuario ${cachedUser.twitchId} (${cachedUser.username})`);
      authProvider.addUser(cachedUser.twitchId, token.token_data)
    }
  })
}

await initializeAuth()
