import { NextFunction, Request, Response } from 'express';
import TwitchAuthenticator from '../modules/TwitchAuthenticator.module';
import User from '../models/User.model';
import UserToken from '../models/UserToken.model';
import Session from '../models/Session.model';
import jwt from 'jsonwebtoken';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import TwitchEvents from '../modules/TwitchEvents.module';
import ExternalAccount, { ExternalAccountProvider } from "../models/ExternalAccount.model";
import Passport from "../../lib/Passport";
import CurrentUser from "../../lib/CurrentUser";
import Audit, { AuditType } from "../models/Audit.model";


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

            const audit = new Audit({
                channel,
                user,
                type: AuditType.LOGIN_SUCCESS,
                data: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });

            try {
                await audit.save();
            } catch (error) {
                console.error(error);
            }

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

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const session = await Session.findBySessionId(user.session.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        if (session.impersonatedUserId) {
            const impersonatedUser = await User.findByTwitchId(session.impersonatedUserId);
            if (!impersonatedUser) {
                return res.status(404).json({ error: 'Impersonated user not found' })
            }

            const impersonatedChannel = await impersonatedUser.getChannel();

            if (!impersonatedChannel) {
                return res.status(404).json({ error: 'Impersonated channel not found' })
            }

            const unreads = await impersonatedUser.getUnreadNotificationsCount();

            user = {
                ...user,
                id: impersonatedUser.twitchId.toString(),
                twitchId: impersonatedUser.twitchId.toString(),
                username: impersonatedUser.username,
                email: impersonatedUser.email || null,
                displayName: impersonatedUser.displayName || impersonatedUser.username,
                avatar: impersonatedUser.avatar || `https://decapi.me/twitch/avatar/${impersonatedUser.username}`,
                channel: impersonatedChannel,
                unread_notifications_count: unreads
            }

            if (!user) {
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

    static async getGreetingsData(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const greetingsData = await user.getGreetingsData();



        res.json({
            data: {
                greetings: greetingsData
            }
        });
    }

    static async getMessages(req: Request, res: Response) {
        const currentUser = req.user as ExpressUser;

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const user = await User.findByTwitchId(parseInt(currentUser.twitchId));

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const messages = await user.getMessages();

        res.json({
            data: {
                messages
            }
        });
    }

    static startLoginFlow(req: Request, res: Response) {
        console.log(req.query);
        const { redirect_uri } = req.query;

        if (!redirect_uri) {
            return res.status(400).json({ error: 'Invalid redirect_uri' })
        }

        const url = TwitchAuthenticator.getAuthorizationUrl(redirect_uri.toString());

        res.redirect(url);
    }

    private static async handleLinkAccount(
        userAccount: User,
        provider: ExternalAccountProvider,
        strategy: string,
        req: Request,
        res: Response
    ) {
        Passport.getPassport().authorize(strategy, { session: false }, async (err: any, profile: { id: string; }, info: {
            expires_in: number; accessToken: string | undefined; refreshToken: string | undefined; expiresAt: Date | undefined;
        }) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to link account' });
            }

            if (!profile) {
                return res.status(400).json({ error: 'Failed to link account' });
            }

            console.log(info)
            console.log(profile)

            const externalAccount = await ExternalAccount.findByProviderAndUser(provider, userAccount);

            if (externalAccount) {
                externalAccount.accountId = profile.id;
                externalAccount.accessToken = info.accessToken;
                externalAccount.refreshToken = info.refreshToken;
                // Si contiene expires_in, calcular la fecha de expiración, de lo contrario, dejarla como está
                let expiresAt = info.expiresAt;
                if (info.expiresAt === undefined && info.expires_in !== undefined) {
                    expiresAt = new Date(Date.now() + (info.expires_in * 1000));
                }
                externalAccount.expiresAt = expiresAt;
                externalAccount.metadata = profile;
                await externalAccount.save();
            } else {
                await ExternalAccount.create(userAccount, provider, profile.id, info.accessToken, info.refreshToken, info.expiresAt, profile);
            }

            return res.status(200).json({ message: 'Account linked successfully' });
        })(req, res);
    }

    static linkExternalAccount(req: Request, res: Response, next: NextFunction) {
        const user = req.user as ExpressUser;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { provider } = req.params;

        if (!provider) {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        let redirectUrl: string | number | string[] | undefined;

        // Guardar la función original de res.end
        const originalEnd = res.end;

        // Sustituir la función res.end para capturar la URL de redirección, y luego enviar la respuesta
        // @ts-ignore
        res.end = function (data: any, encoding: string, callback?: Function) {
            if (!redirectUrl) {
                redirectUrl = this.getHeader('Location');
                this.setHeader('Location', ''); // Limpiar la cabecera para que no se envíe en la respuesta
            }
        };


        switch (provider) {
            case ExternalAccountProvider.SPOTIFY:
                // Invocar authenticate con la estrategia 'spotify'
                // @ts-ignore
                Passport.getPassport().authenticate('spotify', { showDialog: true })(req, res, next);
                break;
            case ExternalAccountProvider.DISCORD:
                // Invocar authenticate con la estrategia 'discord'
                // @ts-ignore
                Passport.getPassport().authenticate('discord', { prompt: true })(req, res, next);
                break;
            default:
                return res.status(400).json({ error: `Provider ${provider} not supported` });
        }


        // Si no se ha establecido una URL de redirección, devolver un error
        if (!redirectUrl) {
            return res.status(500).json({ error: 'Failed to link account' });
        }

        console.log('Redirecting to', redirectUrl);
        res.end = originalEnd;
        return res.status(200).json({ redirectUrl });

    }





    static async linkExternalAccountCallback(req: Request, res: Response) {
        try {
            const user = new CurrentUser(req.user as ExpressUser);

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { provider } = req.params;

            if (!provider) {
                return res.status(400).json({ error: 'Invalid provider' });
            }

            const userAccount = await user.getCurrentUser();

            if (!userAccount) {
                return res.status(404).json({ error: 'User not found' });
            }

            switch (provider) {
                case ExternalAccountProvider.SPOTIFY:
                    AccountsController.handleLinkAccount(userAccount, ExternalAccountProvider.SPOTIFY, 'spotify', req, res);
                    break;
                case ExternalAccountProvider.DISCORD:
                    AccountsController.handleLinkAccount(userAccount, ExternalAccountProvider.DISCORD, 'discord', req, res);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid provider' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to link account' });
        }
    }

    static async unlinkExternalAccount(req: Request, res: Response) {
        try {
            const user = new CurrentUser(req.user as ExpressUser);

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { provider } = req.params as { provider: ExternalAccountProvider };

            if (!provider) {
                return res.status(400).json({ error: 'Invalid provider' });
            }

            const userAccount = await user.getCurrentUser();

            if (!userAccount) {
                return res.status(404).json({ error: 'User not found' });
            }


            const externalAccount = await ExternalAccount.findByProviderAndUser(provider, userAccount);

            if (!externalAccount) {
                return res.status(404).json({ error: 'External account not found' });
            }

            await externalAccount.delete();

            return res.status(200).json({ message: 'Account unlinked successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to unlink account' });
        }
    }

}

export default AccountsController;