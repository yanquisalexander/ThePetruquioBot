import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'
import Database from '@/lib/DatabaseManager'
import chalk from "chalk"

if (!Database.pool) {
  Database.connect()
}

export const dbService = drizzle(Database.pool, {
  schema,
  logger: {
    logQuery: (query, params) => {
      console.log(chalk.green('[DATABASE MANAGER]'), chalk.white('Executing query with Drizzle'))
      console.log(chalk.grey(`>>> QUERY ${query}`))
      console.log(chalk.grey(`>>> PARAMS ${JSON.stringify(params)}`))
    }
  }
})
