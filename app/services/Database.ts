import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'
import Database from '@/lib/DatabaseManager'

if (!Database.pool) {
  Database.connect()
}

export const dbService = drizzle(Database.pool, { schema })
