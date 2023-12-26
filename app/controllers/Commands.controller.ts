import { Request, Response } from "express";
import User from "../models/User.model";
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import { Command, CommandPermission } from "../models/Command.model";
import Session from "../models/Session.model";
import CurrentUser from "../../lib/CurrentUser";

class CommandsController {
    constructor() {
        throw new Error("This class is a static class and should not be instantiated.");
    }

    public static async getCommands(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if (!impersonatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if (!impersonatedChannel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            const commands = await impersonatedChannel.getCommands();

            return res.json({
                data: {
                    commands,
                },
            });
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const commands = await channel.getCommands();

        return res.json({
            data: {
                commands,
            },
        });
    }

    public static async editCommand(req: Request, res: Response) {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await currentUser.getCurrentUser();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await currentUser.getCurrentChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }


        const { commandId } = req.params as unknown as { commandId: number };

        const { response, name, aliases, permissions, enabled } = req.body;

        if (!commandId || !response) {
            return res.status(400).json({ error: 'Command and response are required' });
        }

        const command = await Command.findByIdAndChannel(commandId, channel);

        console.log(command);

        if (!command) {
            return res.status(404).json({ error: 'Command not found' });
        }

        if (name) {
            command.name = name.toLowerCase().replace('!', '').replace(/ /g, '-');
        }

        if (response) {
            command.response = response;
        }

        if (aliases) {
            command.preferences.aliases = aliases;
        }

        if (permissions) {
            if (CommandPermission.EVERYONE in permissions) {
                command.permissions = [CommandPermission.EVERYONE];
            } else {
                command.permissions = permissions;
            }
        }

        if (enabled !== undefined) {
            command.enabled = enabled;
        }

        await command.save(channel);

        return res.json({
            success: true,
            data: {
                command,
                response,
            },
        });
    }


    public static async deleteCommand(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }



        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { commandId } = req.params as unknown as { commandId: number };

        if (!commandId) {
            return res.status(400).json({ error: 'Command is required' });
        }

        const command = await Command.findByIdAndChannel(commandId, channel);

        if (!command) {
            return res.status(404).json({ error: 'Command not found' });
        }

        await command.delete(channel);

        return res.json({
            success: true,
        });
    }

    public static async createCommand(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if (!impersonatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if (!impersonatedChannel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            const { name, response } = req.body;

            if (!name || !response) {
                return res.status(400).json({ error: 'Command and response are required' });
            }

            const command = await Command.find(impersonatedChannel, name);

            if (command) {
                return res.status(400).json({ error: 'Command already exists' });
            }

            const newCommand = new Command(name.toLowerCase().replace('!', '').replace(/ /g, '-'), impersonatedChannel.user.username, [CommandPermission.EVERYONE], '', {}, response);
            newCommand.enabled = true; // By default, commands are enabled
            newCommand.permissions = [
                CommandPermission.EVERYONE
            ];
            try {
                await newCommand.save(impersonatedChannel);

            } catch (error) {
                console.log(error);
                return res.status(500).json({ error: 'Error while saving command' });
            }
            return res.json({
                success: true,
                data: {
                    command: newCommand,
                    response,
                },
            });
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { name, response } = req.body;

        if (!name || !response) {
            return res.status(400).json({ error: 'Command and response are required' });
        }

        const command = await Command.find(channel, name);

        if (command) {
            return res.status(400).json({ error: 'Command already exists' });
        }

        const newCommand = new Command(name.toLowerCase().replace('!', '').replace(/ /g, '-'), channel.user.username, [CommandPermission.VIEWER], '', {}, response);
        newCommand.enabled = true; // By default, commands are enabled
        newCommand.permissions = [
            CommandPermission.EVERYONE
        ];
        try {
            await newCommand.save(channel);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error while saving command' });
        }
        return res.json({
            success: true,
            data: {
                command: newCommand,
                response,
            },
        });
    }
}

export default CommandsController;