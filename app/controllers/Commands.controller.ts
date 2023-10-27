import { Request, Response } from "express";
import User from "../models/User.model";
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import { Command, CommandPermission } from "../models/Command.model";
import Session from "../models/Session.model";

class CommandsController {
    constructor() {
        throw new Error("This class is a static class and should not be instantiated.");
    }

    public static async getCommands(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;
        
        if(!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if(!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if(session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if(!impersonatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if(!impersonatedChannel) {
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

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if(!channel) {
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
        const currentUser = req.user as ExpressUser;
        
        if(!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if(!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if(session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if(!impersonatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if(!impersonatedChannel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            const { commandId } = req.params as unknown as { commandId: number };

            const { response, name } = req.body;

            if(!commandId || !response) {
                return res.status(400).json({ error: 'Command and response are required' });
            }

            const command = await Command.findByIdAndChannel(commandId, impersonatedChannel);

            console.log(command);

            if(!command) {
                return res.status(404).json({ error: 'Command not found' });
            }

            if(name) {
                command.name = name.toLowerCase().replace('!', '').replace(/ /g, '-');
            }

            if(response) {
                command.response = response;
            }

            await command.save(impersonatedChannel);

            return res.json({
                success: true,
                data: {
                    command,
                    response,
                },
            });
        }


        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if(!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { commandId } = req.params as unknown as { commandId: number };

        const { response, name } = req.body;

        if(!commandId || !response) {
            return res.status(400).json({ error: 'Command and response are required' });
        }

        const command = await Command.findByIdAndChannel(commandId, channel);

        console.log(command);

        if(!command) {
            return res.status(404).json({ error: 'Command not found' });
        }

        if(name) {
            command.name = name.toLowerCase().replace('!', '').replace(/ /g, '-');
        }

        if(response) {
            command.response = response;
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
        
        if(!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if(!session) {
            return res.status(404).json({ error: 'Session not found' });
        }



        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if(!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { commandId } = req.params as unknown as { commandId: number };

        if(!commandId) {
            return res.status(400).json({ error: 'Command is required' });
        }

        const command = await Command.findByIdAndChannel(commandId, channel);

        if(!command) {
            return res.status(404).json({ error: 'Command not found' });
        }

        await command.delete(channel);

        return res.json({
            success: true,
        });
    }

    public static async createCommand(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;
        
        if(!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if(!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if(session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);

            if(!impersonatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if(!impersonatedChannel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            const { name, response } = req.body;

            if(!name || !response) {
                return res.status(400).json({ error: 'Command and response are required' });
            }

            const command = await Command.find(impersonatedChannel, name);

            if(command) {
                return res.status(400).json({ error: 'Command already exists' });
            }

            const newCommand = new Command(name.toLowerCase().replace('!', '').replace(/ /g, '-'), impersonatedChannel.user.username, [ CommandPermission.VIEWER ], '', {}, response);

            await newCommand.save(impersonatedChannel);

            return res.json({
                success: true,
                data: {
                    command: newCommand,
                    response,
                },
            });
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await user.getChannel();

        if(!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { name, response } = req.body;

        if(!name || !response) {
            return res.status(400).json({ error: 'Command and response are required' });
        }

        const command = await Command.find(channel, name);

        if(command) {
            return res.status(400).json({ error: 'Command already exists' });
        }

        const newCommand = new Command(name.toLowerCase().replace('!', '').replace(/ /g, '-'), channel.user.username, [ CommandPermission.VIEWER ], '', {}, response);

        await newCommand.save(channel);

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