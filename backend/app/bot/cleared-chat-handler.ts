import chalk from 'chalk';

export const handleClearedChat = (channel: string) => {
    console.log(chalk.green('[BOT]'), chalk.yellow(`Chat cleared in ${chalk.bold.cyan(channel)}`));
}