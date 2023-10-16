import pg from 'pg';
import 'dotenv/config'
import chalk from 'chalk';

const { Pool } = pg;


class Database {
    private static pool: pg.Pool;

    static connect() {
        if (!Database.pool) {
            Database.pool = new Pool({
                database: process.env.DB_NAME || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT as string || '5432'),
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASS || 'postgres',
            });

            console.log(chalk.green('[DATABASE MANAGER]'), chalk.yellow('Conectado a la base de datos'));

            // Manejo de errores en la conexión
            Database.pool.on('error', (err: any) => {
                console.error('Unexpected error on idle client', err);
            });
        }
    }

    static async query(text: string, params: any[] = []): Promise<any> {
        const client = await Database.pool.connect();

        try {
            const result = await client.query(text, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    static async runMigration(sql: string, name: string): Promise<void> {
        const client = await Database.pool.connect();

        try {
            await client.query(sql);
            console.log(chalk.grey(`>>> MIGRATED ${name}`))
        } catch (error) {
            console.error(chalk.red('[MIGRATION ERROR]'), error);
        } finally {
            client.release();
        }
    }

    static async close(): Promise<void> {
        await Database.pool.end();
    }
}

export default Database;