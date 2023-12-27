import chalk from 'chalk';
import Channel from '../app/models/Channel.model';
import { Command, CommandPermission } from '../app/models/Command.model';
import ChatUser from '../utils/chat-user';
import fs from 'fs/promises';
import { Bot } from '../bot';
import TranslatorModule from '../app/modules/Translator.module';
import Environment from '../utils/environment';
// @ts-ignore
async function importCommandModules() {
    const commandFiles = await fs.readdir('./app/commands');
    const commandModules = [];

    for (const file of commandFiles) {
        if (file.endsWith('.command.ts')) {
            const module = await import(`../app/commands/${file}`);
            commandModules.push(module.default);
        }
    }

    return commandModules;
}


const cooldowns = new Map();

class CommandExecutor {
    private systemCommands: Command[] = [];
    private static instance: CommandExecutor | null = null;
    constructor() {
        this.loadCommands().then((commands) => {
            this.systemCommands = commands;
        });
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



    async loadCommands(): Promise<Command[]> {
        const systemCommandsArray = await importCommandModules();
        const commands = [];

        if (!Array.isArray(systemCommandsArray)) {
            throw new Error('systemCommandsArray debe ser una matriz');
        }


        for (let command of systemCommandsArray) {
            if (!command || !command.name || !command.execute) {
                console.log(`[COMMAND EXECUTOR] ${chalk.red('ERROR:')} Command ${command.name} is invalid.`);
            }

            commands.push(command);
            console.log(
                chalk.green('[COMMAND EXECUTOR]'),
                chalk.white(`Loaded command ${command.name}.`)
            );
        }

        return commands;
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
            if (!command) {
                try {
                    let channelCommands = await Command.getChannelCommands(channelData);
                    if (channelCommands) {
                        for (let channelCommand of channelCommands) {
                            if (channelCommand.preferences.aliases?.includes(commandName)) {
                                command = channelCommand;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log(chalk.red('[COMMAND EXECUTOR]'), chalk.white(`Error while getting channel commands: ${error}`));
                }
            }

            if (command) {
                if (!this.checkUserPermissions(user, command)) {
                    return;
                }

                if (!this.checkCooldowns(user, command, channelData)) {
                    return;
                }

                if (!command.enabled) {
                    return;
                }

                return await command.execute(user, args, channelData, bot);
            } else {
                if (TranslatorModule.languageList.includes(commandName) && channelData.preferences.enableTranslations?.value) {
                    const translated = await TranslatorModule.generateMessage(commandName, args.join(' '), user.displayName);
                    return translated;
                }
            }
            return;
        }
    }

    private checkUserPermissions(user: ChatUser, command: Command): boolean {
        if (!user) {
            return false;
        }

        const commandPermissions = command.getPermissions();

        if(commandPermissions.includes(CommandPermission.EVERYONE)) {
            return true;
        }

        if (commandPermissions.includes(CommandPermission.VIEWER)) {
            return user.isViewer;
        }

        for (const permission of commandPermissions) {
            switch (permission) {
                case CommandPermission.BROADCASTER:
                    if (user.isBroadcaster) return true;
                    break;
                case CommandPermission.MODERATOR:
                    if (user.isMod) return true;
                    break;
                case CommandPermission.SUBSCRIBER:
                    if (user.isSubscriber) return true;
                    break;
                case CommandPermission.VIP:
                    if (user.isVIP) return true;
                    break;
                case CommandPermission.BOT_OWNER:
                    if (user.isBotOwner) return true;
                    break;
            }
        }

        return false;
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
