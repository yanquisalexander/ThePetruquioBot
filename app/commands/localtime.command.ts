import { Command, CommandPermission } from "../models/Command.model";
import SpectatorLocation from "../models/SpectatorLocation.model";
import chalk from "chalk";
import ct, { Timezone } from 'countries-and-timezones';
import { DateTime, Duration } from 'luxon';

const LocalTimeCommand = new Command(
    'localtime',
    '*',
    [CommandPermission.EVERYONE],
    'Devuelve la hora local del usuario.',
    {},
    '', // System commands don't need a response
    async (_user, _args, _channel, _bot) => {
        try {
            const userLocation = await SpectatorLocation.findByUserId(_user.id);

            if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
                _bot.sendMessage(_channel, `@${_user.displayName}, parece que no tienes una ubicación registrada. Usa !from para registrar tu ubicación.`);
                return;
            }

            let timezone: Timezone | string = 'UTC';
            try {
                const userTimezones = ct.getTimezonesForCountry(userLocation.countryCode || 'US');
                if (userTimezones && userTimezones.length > 0) {
                    timezone = userTimezones[0].name;
                }

                const date = DateTime.local().setZone(timezone);
                const offsetHours = date.offset / 60;
                const offsetMinutes = date.offset % 60;
                const offsetString = `${offsetHours > 0 ? '+' : ''}${offsetHours}:${offsetMinutes}`;
                const timeString = date.toLocaleString(DateTime.TIME_24_SIMPLE);
                console.log(chalk.green('[GREETINGS]'), chalk.white('Local time for'), chalk.yellow(_user.displayName), chalk.white('is'), chalk.yellow(timeString), chalk.white('in timezone'), chalk.yellow(timezone), chalk.white('with offset'), chalk.yellow(offsetString));
                console.log(`Hours: ${date.hour}, Minutes: ${date.minute}, Offset: ${date.offset}`)
                _bot.sendMessage(_channel, `@${_user.displayName}, la hora local es ${timeString} (UTC${offsetString})`);
            } catch (error) {
                console.error(chalk.red('[GREETINGS]'), chalk.white('Error getting timezone:'), error);
            }
        } catch (error) {
            console.error(chalk.red('[GREETINGS]'), chalk.white('Error getting timezone:'), error);
        }
        return;
    }
);

export default LocalTimeCommand;