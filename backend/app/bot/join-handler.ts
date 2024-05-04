import chalk from 'chalk';

export const handleBotJoin = (channel: string, username: string, self: boolean) => {
    if (self) {
        console.log(chalk.green('[BOT]'), chalk.yellow(`Joined ${chalk.bold.cyan(channel)}`));
    }
}