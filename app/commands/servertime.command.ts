// Importa las dependencias necesarias y los modelos si no lo has hecho ya
import { Command, CommandPermission } from "../models/Command.model";
import chalk from "chalk";
import { DateTime } from 'luxon';

// Define el nuevo comando
const ServerTimeCommand = new Command(
    'servertime',
    '*',
    [CommandPermission.EVERYONE],
    'Devuelve la hora del servidor.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        try {
            // Obtén la fecha y hora actuales del servidor
            const serverTime = DateTime.local();

            // Formatea la fecha y hora en un formato legible
            const timeString = serverTime.toLocaleString(DateTime.TIME_SIMPLE);

            // Envía el mensaje con la hora del servidor al canal
            _bot.sendMessage(_channel, `@${_user.displayName}, la hora del servidor es ${timeString}`);
        } catch (error) {
            console.error(chalk.red('[ServerTime]'), chalk.white('Error obteniendo la hora del servidor:'), error);
        }
    }
);

// Exporta el nuevo comando
export default ServerTimeCommand;
