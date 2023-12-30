import { Request, Response } from "express";
import { ExpressUser } from "../interfaces/ExpressUser.interface";
import User from "../models/User.model";
import MemoryVariables from "../../lib/MemoryVariables";
import { promisify } from "util";
import { exec } from "child_process";
import Session from "../models/Session.model";
import AdminDashboardProblems from "../models/admin/DashboardProblems.model";
import Audit, { AuditType } from "../models/Audit.model";
import UserToken from "../models/UserToken.model";
import TwitchAuthenticator from "../modules/TwitchAuthenticator.module";

const removeAnsiColors = (str: string) => str.replace(/\u001b\[[0-9]{1,2}m/g, '');

class AdminController {
    static async dashboardIndex(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const cleanedLogs = MemoryVariables.getLogs().map((log) => removeAnsiColors(log));

        return res.json({
            data: {
                system: {
                    logs: cleanedLogs
                },
                problems: AdminDashboardProblems.getProblems() || []
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

    static async impersonateUser(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        const session = await Session.findBySessionId(currentUser.session.sessionId);




        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { userId } = req.params

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const userToImpersonate = await User.findByTwitchId(parseInt(userId));

        if (!userToImpersonate) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channel = await userToImpersonate.getChannel();

        if (!channel) {
            return res.status(404).json({ error: 'You cannot impersonate a user without a channel' });
        }


        const audit = new Audit({
            channel,
            user: user,
            type: AuditType.IMPERSONATED_BY_ADMIN,
            data: {}
        });

        try {
            await audit.save();
        } catch (error) {
            console.error(error);
        }

        await session.setImpersonate(userToImpersonate.twitchId);

        return res.json({
            sucess: true
        });
    }

    static async stopImpersonatingUser(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        const session = await Session.findBySessionId(currentUser.session.sessionId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.setImpersonate(null);

        return res.json({
            sucess: true
        });
    }

    static async refreshUserToken(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const targetUser = await User.findByTwitchId(parseInt(userId));
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const targetUserChannel = await targetUser.getChannel();
        const userToken = await UserToken.findByUserId(targetUser.twitchId);

        if (!userToken) {
            return res.status(404).json({ error: "User's token not found" });
        }


        const audit = new Audit({
            targetUserChannel,
            user: user,
            type: AuditType.TOKEN_REFRESHED_BY_SYSTEM,
            data: {}
        });

        try {
            const token = await TwitchAuthenticator.RefreshingAuthProvider.refreshAccessTokenForUser(targetUser.twitchId);
            userToken.tokenData = token;
            await userToken.save();

            try {
                await audit.save();
            } catch (error) {
                console.error(error);
            }

            return res.json({
                sucess: true,
                token,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: (error as Error).message });
        }
    }
}

export default AdminController;