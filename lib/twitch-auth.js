import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import dotenv from 'dotenv';
import { db } from './database.js';

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

// Crea una instancia del proveedor de autenticación
export const authProvider = new RefreshingAuthProvider({
  clientId,
  clientSecret,
  onRefresh: async (userId, newTokenData) => {
    // Función que se ejecuta al actualizar el token de acceso
    await writeToken(userId, newTokenData);
  },
});

// Función para leer el token de un usuario desde la base de datos
async function readToken(userId) {
  try {
    const result = await db.query('SELECT token_data FROM tokens WHERE user_id = $1 LIMIT 1', [userId]);
    if (result.rows.length > 0) {
      return result.rows[0].token_data;
    }
    return null;
  } catch (error) {
    console.log(`Error al leer el token para el usuario ${userId}:`, error);
    return null;
  }
}

// Función para escribir el token de un usuario en la base de datos
async function writeToken(userId, tokenData) {
  try {
    await db.query('INSERT INTO tokens (user_id, token_data) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token_data = $2', [userId, tokenData]);
    console.log(`Token actualizado y guardado para el usuario ${userId}`);
  } catch (error) {
    console.log(`Error al escribir el token para el usuario ${userId}:`, error);
  }
}

// Función para obtener el token de acceso de un usuario
export async function getAccessToken(userId) {
  const tokenData = await readToken(userId);

  if (tokenData) {
    await authProvider.addUser(userId, tokenData);
    const tokenInfo = await authProvider.getAccessTokenForUser(userId);
    return tokenInfo.accessToken;
  } else {
    console.error(`No se encontró el token para el usuario ${userId}`);
    return null;
  }
}

// Inicializa el proveedor de autenticación y el cliente de la API
async function initializeAuth() {
  const tokenData = await readToken(twitchUserId);

  if (tokenData) {
    await authProvider.addUser(twitchUserId, tokenData);
  } else {
    console.error('No se encontró el token');
    return;
  }
}

// Inicializa la autenticación y el cliente de la API
initializeAuth();
