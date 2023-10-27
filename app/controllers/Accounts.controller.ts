import { Request, Response } from 'express';
import TwitchAuthenticator from '../modules/TwitchAuthenticator.module';
import User from '../models/User.model';
import UserToken from '../models/UserToken.model';
import Session from '../models/Session.model';
import jwt from 'jsonwebtoken';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import TwitchEvents from '../modules/TwitchEvents.module';


class AccountsController {
    static async getToken(req: Request, res: Response) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ error: 'Invalid code' })
            }

            const token = await TwitchAuthenticator.exchangeCode(code);

            try {
                await TwitchAuthenticator.validateToken(token);
            } catch (error) {
                return res.status(400).json({ error: 'Access token is invalid' })
            }

            const userInfo = await TwitchAuthenticator.getUserInfo(token);

            if (!userInfo) {
                return res.status(401).json({ error: 'Failed to get user info' })
            }

            TwitchAuthenticator.RefreshingAuthProvider.addUser(userInfo.data[0].id, token);

            let user = await User.findByTwitchId(userInfo.data[0].id);

            if (!user) {
                try {
                    const newUser = new User(userInfo.data[0].username, userInfo.data[0].id, userInfo.data[0].email, userInfo.data[0].display_name);
                    await newUser.save();
                    user = newUser
                } catch (error) {
                    return res.status(500).json({ error: 'Failed to create user' })
                }
            }

            user.email = userInfo.data[0].email;
            user.displayName = userInfo.data[0].display_name;
            user.avatar = userInfo.data[0].profile_image_url;

            await user.save();

            let channel = await user.getChannel();

            if (!channel) {
                /* On login by default we create a channel for the user if it doesn't exist */
                channel = await user.createChannelWithPreferences();
            }

            const userToken = await UserToken.findByUserId(userInfo.data[0].id);
            if (userToken) {
                userToken.tokenData = token;
                await userToken.save();
            } else {
                try {
                    const newUserToken = new UserToken(userInfo.data[0].id, token);
                    await newUserToken.save();
                } catch (error) {
                    return res.status(500).json({ error: 'Failed to create user token' })
                }
            }

            const session = await Session.create(userInfo.data[0].id, '', '');
            console.log(`Created session ${session.sessionId} for user ${userInfo.data[0].id}`);

            const customToken = jwt.sign({
                user,
                sessionId: session.sessionId
            }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

            await TwitchEvents.subscribeChannel(channel)

            res.json({ token: customToken });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to get token' })
        }

    }

    static async currentUser(req: Request, res: Response) {
        const user = req.user as ExpressUser

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        user.avatar = `https://decapi.me/twitch/avatar/${user.username}`;
        res.json({ user });
    }

    static async currentSession(req: Request, res: Response) {
        let user = req.user as ExpressUser;

        if(!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }
        
        const session = await Session.findBySessionId(user.session.sessionId);

        if(!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        if(session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);
            if(!impersonatedUser) {
                return res.status(404).json({ error: 'Impersonated user not found' })
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if(!impersonatedChannel) {
                return res.status(404).json({ error: 'Impersonated channel not found' })
            }

            user = {
                ...user,
                id: impersonatedUser.twitchId.toString(),
                twitchId: impersonatedUser.twitchId.toString(),
                username: impersonatedUser.username,
                email: impersonatedUser.email || null,
                displayName: impersonatedUser.displayName || impersonatedUser.username,
                avatar: impersonatedUser.avatar || `https://decapi.me/twitch/avatar/${impersonatedUser.username}`,
                channel: impersonatedChannel
            }

            if(!user) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            user.avatar = impersonatedUser.avatar || `https://decapi.me/twitch/avatar/${impersonatedUser.username}`;

            return res.json({ user, session });
        }

        return res.json({ user, session });
    }

    static async destroySession(req: Request, res: Response) {
        const user = req.user as ExpressUser;

        const session = await Session.findBySessionId(user.session.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        await session.revokeCurrent();

        res.json({ message: 'Session destroyed' });
    }
}

export default AccountsController;