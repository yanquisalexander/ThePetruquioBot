import dotenv from 'dotenv';

dotenv.config()

export const debugMode = process.env.ENABLE_DEBUG || false