import chalk from 'chalk';
import dotenv from 'dotenv';

import MonkeyPatches from '@/lib/MonkeyPatches';
import Database from '@/lib/DatabaseManager';
import { Bot } from '@/bot';
import CommandExecutor from '@/lib/CommandExecutor';
import TwitchAuthenticator from '@/app/modules/TwitchAuthenticator.module';
import Twitch from '@/app/modules/Twitch.module';
import GreetingsManager from '@/app/modules/GreetingsManager.module';
import WebServer from '@/app/modules/WebServer.module';
import TwitchEvents from '@/app/modules/TwitchEvents.module';
import Environment from '@/utils/environment';
import Passport from '@/lib/Passport';
import EmailManager from '@/app/modules/EmailManager.module';


MonkeyPatches.apply();

Database.connect();

const initializeApp = async (): Promise<void> => {
  try {
    dotenv.config();
    await initializeServices();
    console.log(chalk.bgCyan.bold('[APP]'), chalk.white('All services initialized.'));
  } catch (error) {
    handleAppError(error);
  }
};

const initializeServices = async (): Promise<void> => {
  const bot = await Bot.getInstance();

  // Configura el protocolo HTTPS según la variable de entorno
  Environment.https = process.env.HTTPS === 'true';
  CommandExecutor.initialize();
  await Passport.setup();

  await initializeTwitchServices();

  // Inicializa el gestor de saludos
  GreetingsManager.initialize();

  // Inicializa el gestor de emails
  EmailManager.initialize();

  // Inicializa el bot
  await initializeBot(bot);

  // Configura los eventos de Twitch
  await TwitchEvents.setup();

  // Inicializa el servidor web
  await WebServer.boot();
};

// Función para inicializar los servicios relacionados con Twitch
const initializeTwitchServices = async (): Promise<void> => {
  try {
    // Inicializa el autenticador de Twitch
    await TwitchAuthenticator.initialize();

    // Inicializa el módulo de Twitch
    await Twitch.initialize();

    // Inicializa el monitor de streams en viv.
    await Twitch.initializeLiveMonitor();
  } catch (error) {
    throw new Error(`
      Failed to initialize Twitch services.
      
      This is a critical error because Twitch services are essential.
      Please check your environment variables and ensure that TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are set.
      
      [APP ERROR] ${error}
    `);
  }
};

// Función para inicializar el bot
const initializeBot = async (bot: Bot): Promise<void> => {
  try {
    await bot.joinChannel(bot.getBotClient().getUsername());
  } catch (error) {

  }
};

// Función para manejar errores de la aplicación
const handleAppError = (error: any): void => {
  // Imprime el error
  console.error(chalk.red('[APP ERROR]'), error);

  // Sale del proceso con código de error
  process.exit(1);
};

// Inicializa la aplicación
initializeApp().catch(handleAppError);

// Maneja errores no capturados de manera global
process.on('uncaughtException', (err) => {
  console.error('Asynchronous error caught:', err);
});
