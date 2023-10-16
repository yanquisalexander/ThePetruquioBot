"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
require("dotenv/config");
const chalk_1 = __importDefault(require("chalk"));
const { Pool } = pg_1.default;
class Database {
    static connect() {
        if (!Database.pool) {
            Database.pool = new Pool({
                database: process.env.DB_NAME || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASS || 'postgres',
            });
            console.log(chalk_1.default.green('[DATABASE MANAGER]'), chalk_1.default.yellow('Conectado a la base de datos'));
            // Manejo de errores en la conexión
            Database.pool.on('error', (err) => {
                console.error('Unexpected error on idle client', err);
            });
        }
    }
    static query(text, params = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield Database.pool.connect();
            try {
                const result = yield client.query(text, params);
                return result.rows;
            }
            finally {
                client.release();
            }
        });
    }
    static runMigration(sql, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield Database.pool.connect();
            try {
                yield client.query(sql);
                console.log(chalk_1.default.grey(`>>> MIGRATED ${name}`));
            }
            catch (error) {
                console.error(chalk_1.default.red('[MIGRATION ERROR]'), error);
            }
            finally {
                client.release();
            }
        });
    }
    static close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Database.pool.end();
        });
    }
}
exports.default = Database;
