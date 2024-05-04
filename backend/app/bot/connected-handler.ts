import chalk from 'chalk';

export const handleBotConnected = (address: string, port: number) => {
    console.log(chalk.green('[IRC]'), chalk.yellow(`Connected to ${chalk.bold.cyan(address)}:${chalk.bold.cyan(port)}`));
}