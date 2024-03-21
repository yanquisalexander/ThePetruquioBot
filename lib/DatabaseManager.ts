import pg, { type QueryResult } from 'pg'
import 'dotenv/config'
import chalk from 'chalk'

const { Pool } = pg

class Database {
  public static pool: pg.Pool

  static connect (): void {
    if (!Database.pool) {
      Database.pool = new Pool({
        database: process.env.DB_NAME ?? 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432'),
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASS ?? ''
      })

      // Manejo de errores en la conexión
      Database.pool.on('error', (err: any) => {
        console.error('Unexpected error on idle client', err)
      })

      Database.pool.on('connect', () => {
        console.log(chalk.green('[DATABASE MANAGER]'), chalk.yellow('Conectado a la base de datos'))
      })
    }
  }

  static async query (text: string, params: any[] = [], skipLog: boolean = false): Promise<QueryResult> {
    const client = await Database.pool.connect()

    try {
      if (!skipLog) {
        console.log(chalk.green('[DATABASE MANAGER]'), chalk.white('Executing query'))
        const startTime = Date.now()
        const result = await client.query(text, params)
        const endTime = Date.now()
        const duration = endTime - startTime
        console.log(chalk.grey(`>>> QUERY ${text.replace(/\$[0-9]+/g, (match) => {
                    const index = parseInt(match.replace('$', ''))
                    return params[index - 1]
                })}`))
        console.log(chalk.grey(`>>> PARAMS ${JSON.stringify(params)}`))
        console.log(chalk.grey(`>>> ROWS AFFECTED ${result.rowCount}`))
        console.log(chalk.grey(`>>> TIME TAKEN ${duration}ms`))

        return result
      } else {
        return await client.query(text, params)
      }
    } catch (error) {
      console.error(chalk.red('[DATABASE MANAGER]'), error)
      throw error
    } finally {
      client.release()
    }
  }

  static async runMigration (sql: string, name: string): Promise<void> {
    const client = await Database.pool.connect()

    try {
      await client.query(sql)
      console.log(chalk.grey(`>>> MIGRATED ${name}`))
    } catch (error) {
      console.error(chalk.red('[MIGRATION ERROR]'), error)
    } finally {
      client.release()
    }
  }

  static async close (): Promise<void> {
    await Database.pool.end()
  }
}

export default Database
