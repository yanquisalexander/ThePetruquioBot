import 'dotenv/config'

export const Configuration = {
  BOT_NAME: process.env.BOT_NAME ?? 'PetruquioLIVE',
  BOT_PASSWORD: process.env.BOT_PASSWORD ?? 'oauth:1234567890',
  TWITCH_USER_ID: process.env.TWITCH_USER_ID ?? '',
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ?? '',
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET ?? '',
  HTTPS: process.env.HTTPS === 'true' || false,
  JWT_SECRET: process.env.JWT_SECRET ?? 'secret',
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? '',
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ?? '5432',
  DB_USERNAME: process.env.DB_USERNAME ?? 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'password',
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ?? '',
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ?? '',
  SPOTIFY_CALLBACK_URL: process.env.SPOTIFY_CALLBACK_URL ?? '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? '',
  DISCORD_CALLBACK_URL: process.env.DISCORD_CALLBACK_URL ?? '',
  WEBSITE_URL: process.env.WEBSITE_URL ?? 'http://localhost:3000',
  HOSTNAME: process.env.HOSTNAME ?? 'localhost',
  DEVELOPMENT_CHANNELS: process.env.CHANNELS?.split(',') ?? ['alexitoo_uy, petruquiolive'],
  LEMON_API_KEY: process.env.LEMON_API_KEY ?? '',
  LEMON_STORE_ID: process.env.LEMON_STORE_ID ?? '',
  LEMON_PRODUCT_ID: process.env.LEMON_PRODUCT_ID ?? ''
}
