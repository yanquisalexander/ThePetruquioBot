import { Configuration } from '@/app/config'
import { dbService } from '@/app/services/Database'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'node:path'

console.log('Running migrations...')
console.log(Configuration)

export const runMigrations = migrate(dbService, { migrationsFolder: path.join(__dirname, '../db/drizzle') })
  .then(() => {
    console.log('Migrations ran successfully')
    return true
  })
  .catch((error) => { console.error('Error running migrations', error) })
