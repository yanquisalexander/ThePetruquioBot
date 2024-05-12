import pg, { type QueryResult } from 'pg'
import 'dotenv/config'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { exec } from 'child_process'

const { Pool } = pg

class Database {
  public static pool: pg.Pool

  static connect(): void {
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

  static async query(text: string, params: any[] = [], skipLog: boolean = false): Promise<QueryResult> {
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

  static async runMigration(sql: string, name: string): Promise<void> {
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

  static async close(): Promise<void> {
    await Database.pool.end()
  }

  static async createBackup(): Promise<string> {
    // Use pg_dump to create a backup of the database
    const rootPath = path.resolve(__dirname, '..');
    const backupFileName = `backup-${new Date().toISOString().replace(/:/g, '-')}.sql`;
    const backupFilePath = `${rootPath}/public/backups/${backupFileName}`;

    const backupCommand = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} ${process.env.DB_NAME} > ${backupFilePath}`;
    console.log(chalk.green('[DATABASE MANAGER]'), chalk.white('Creating backup...'));
    console.log(chalk.grey(`>>> COMMAND ${backupCommand}`));

    exec(backupCommand, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(chalk.red('[DATABASE MANAGER]'), error);
        return;
      }
      if (stderr) {
        console.error(chalk.red('[DATABASE MANAGER]'), stderr);
        return;
      }

      if (stdout) {
        console.log(chalk.grey(stdout));
      }
      console.log(chalk.green('[DATABASE MANAGER]'), chalk.white('Backup created.'));

      // Create a zip file
      const zipFileName = 'backup.zip';
      const zipFilePath = `${__dirname}/${zipFileName}`;
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        console.log(chalk.green('[DATABASE MANAGER]'), chalk.white(`Backup zip created: ${zipFileName}`));
        // Optionally, you can delete the original backup file after creating the zip
        fs.unlinkSync(backupFilePath);
      });

      archive.on('error', (err: any) => {
        console.error(chalk.red('[DATABASE MANAGER]'), err);
      });

      archive.pipe(output);
      archive.file(backupFilePath, { name: backupFileName });

      archive.finalize().then(() => {
        console.log(chalk.green('[DATABASE MANAGER]'), chalk.white('Backup zip finalized.'));
      }).catch((err: any) => {
        console.error(chalk.red('[DATABASE MANAGER]'), err);
      });

      return zipFilePath;
    });

    return backupFilePath;
  }
}

export default Database
