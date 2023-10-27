import { Request, Response } from "express";
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import User from "../models/User.model";
import MemoryVariables from "../../lib/MemoryVariables";
import { promisify } from "util";
import { exec } from "child_process";

const removeAnsiColors = (str: string) => str.replace(/\u001b\[[0-9]{1,2}m/g, '');

class AdminController {
    static async dashboardIndex(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if(!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const cleanedLogs = MemoryVariables.getLogs().map((log) => removeAnsiColors(log));

        return res.json({
            data: {
                system: {
                    logs: cleanedLogs
                }
            }
        })
    }

    static async remoteConsole(req: Request, res: Response) {
        /* WARNING ⚠️
        This is a very dangerous endpoint.
        It allows anyone with access to it to run commands on the server.

        Should only be used for CLI commands or debugging purposes.
        */

        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { requestedAutocomplete } = req.body;
        const { command } = req.body;

        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }

        if (requestedAutocomplete) {
            const { execSync } = require('child_process');
            const autocomplete = execSync(`compgen -c ${command}`).toString().split('\n');
            return res.json({
                data: {
                    autocomplete
                }
            });
        }

        MemoryVariables.getLogs().push(`> ${command}`);

        const asyncExec = promisify(exec);

        try {
            const { stdout, stderr } = await asyncExec(command);

            if (stderr) {
                MemoryVariables.getLogs().push(`stderr: ${stderr}`);
                return res.json({
                    data: {
                        success: false,
                        output: stderr
                    }
                });
            }

            MemoryVariables.getLogs().push(`stdout: ${stdout}`);
            return res.json({
                data: {
                    success: true,
                    output: stdout
                }
            });
        } catch (error) {
            MemoryVariables.getLogs().push(`error: ${(error as Error).message}`);
            return res.json({
                data: {
                    success: false,
                    output: (error as Error).message
                }
            });
        }
    }

    static async getUsers(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const users = await User.findAll();

        return res.json({
            data: {
                users
            }
        });
    }
}

export default AdminController;