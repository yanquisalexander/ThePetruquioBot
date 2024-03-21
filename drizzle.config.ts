import type { Config } from 'drizzle-kit'
import { Configuration } from './app/config'

export default {
  schema: './db/schema.ts',
  out: './db/drizzle',
  driver: 'pg',
  dbCredentials: {
    database: Configuration.DB_NAME,
    host: Configuration.DB_HOST,
    port: parseInt(Configuration.DB_PORT),
    user: Configuration.DB_USER,
    password: Configuration.DB_PASS
  }
} satisfies Config
