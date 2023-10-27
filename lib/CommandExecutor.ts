import chalk from 'chalk';
import Channel from '../app/models/Channel.model';
import { Command, CommandPermission } from '../app/models/Command.model';
import ChatUser from '../utils/chat-user';
import fs from 'fs';
import { Bot } from '../bot';
import TranslatorModule from '../app/modules/Translator.module';

const cooldowns = new Map();

class CommandExecutor {
    private systemCommands: Command[] = [];
    private static instance: CommandExecutor | null = null;
    constructor() {
        this.loadSystemCommands();
    }

    public static getInstance(): CommandExecutor {
        if (this.instance === null) {
            this.instance = new CommandExecutor();
        }
        return this.instance;
    }

    public static initialize(): void {
        this.getInstance();
        console.log(chalk.green('[COMMAND EXECUTOR]'), chalk.white('Initialized.'));
    }



    private loadSystemCommands() {
        /* Load files from /app/commands  */
        const commandFiles = fs.readdirSync('./app/commands');
    
        for (const file of commandFiles) {
            if (file.endsWith('.command.ts')) {
                try {
                    const command = require(`../app/commands/${file}`).default;
                    
                    if (command && command.name && command.execute) {
                        this.systemCommands.push(command);
                    } else {
                        console.error(chalk.red('[COMMAND EXECUTOR]'), chalk.white(`Command ${file} is not valid.`));
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
    

    private getSystemCommand(commandName: string): Command | undefined {
        return this.systemCommands.find((command) => command.getName() === commandName);
    }

    public async executeCommand(user: ChatUser, commandName: string, args: string[], channelData: Channel, bot: Bot): Promise<string | void> {
        const systemCommand = this.getSystemCommand(commandName);

        if (systemCommand) {
            if (!this.checkUserPermissions(user, systemCommand)) {
                return;
            }

            if (!this.checkCooldowns(user, systemCommand, channelData)) {
                return;
            }

            return await systemCommand.execute(user, args, channelData, bot);
        }
        else {
            let command = await Command.find(channelData, commandName);
            if (command) {
                if (!this.checkUserPermissions(user, command)) {
                    return;
                }

                if (!this.checkCooldowns(user, command, channelData)) {
                    return;
                }

                return await command.execute(user, args, channelData, bot);
            } else {
                if (TranslatorModule.languageList.includes(commandName) && channelData.preferences.enableTransitions?.value) {
                    const translated = await TranslatorModule.generateMessage(commandName, args.join(' '), user.displayName);
                    return translated;
                }
            }
            return;
        }
    }

    private checkUserPermissions(user: ChatUser, command: Command): boolean {

        const commandPermissions = command.getPermissions();

        if (commandPermissions.includes(CommandPermission.BROADCASTER)) {
            return user.isBroadcaster;
        }

        if (commandPermissions.includes(CommandPermission.MODERATOR)) {
            return user.isModerator;
        }

        if (commandPermissions.includes(CommandPermission.SUBSCRIBER)) {
            return user.isSubscriber;
        }

        if (commandPermissions.includes(CommandPermission.VIP)) {
            return user.isVIP;
        }

        return true;
    }

    private checkCooldowns(user: ChatUser, command: Command, channel: Channel): boolean {
        if (!cooldowns.has(channel.user.username)) {
            cooldowns.set(channel.user.username, new Map());
        }

        const userCooldowns = cooldowns.get(channel.user.username);

        if (!userCooldowns.has(user.username)) {
            userCooldowns.set(user.username, new Map());
        }

        const userCommandCooldowns = userCooldowns.get(user.username);

        if (!userCommandCooldowns.has(command.getName())) {
            userCommandCooldowns.set(command.getName(), {
                userCooldown: Date.now() - (command.getPreferences()?.userCooldown || 5) * 1000,
                globalCooldown: Date.now() - (command.getPreferences()?.globalCooldown || 5) * 1000,
            });
            return true;
        }

        const cooldownInfo = userCommandCooldowns.get(command.getName());

        const remainingUserCooldown = cooldownInfo.userCooldown + (command.getPreferences()?.userCooldown || 5) * 1000 - Date.now();
        const remainingGlobalCooldown = cooldownInfo.globalCooldown + (command.getPreferences()?.globalCooldown || 5) * 1000 - Date.now();

        if (remainingUserCooldown > 0 || remainingGlobalCooldown > 0) {
            return false;
        }

        cooldownInfo.userCooldown = Date.now();
        cooldownInfo.globalCooldown = Date.now();
        return true;
    }


}


export default CommandExecutor;
