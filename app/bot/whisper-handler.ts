import chalk from "chalk";
import { ChatUserstate } from "tmi.js";

export const handleWhisper = async (from: string, userstate: ChatUserstate, message: string, self: boolean) => {
    console.log(chalk.bgWhite.blue.bold(`Whisper received from ${from}: ${message}`));
}
