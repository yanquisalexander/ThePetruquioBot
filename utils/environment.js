import dotenv from 'dotenv';

dotenv.config()

export const debugMode = process.env.ENABLE_DEBUG || false

export const railwayConnected = Boolean(process.env.RAILWAY_API_KEY)