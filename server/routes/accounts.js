import axios from "axios";
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../../app/models/User.js";
import UserToken from "../../app/models/UserToken.js";
import passport from "../../lib/passport.js";
import { exchangeCode } from '@twurple/auth';
import { authProvider } from "../../lib/twitch-auth.js";
import BotModel from "../../app/models/Bot.js";
import Session from "../../app/models/Session.js";
import { merge } from "lodash-es";


const AccountsRouter = Router();

AccountsRouter.post("/get-token", async (req, res) => {
    // Aquí puedes realizar la lógica para obtener el access_token desde Twitch
    console.log(req.body);
    const code = req.body.code;
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.NODE_ENV === 'development' ? 'http://localhost:8888/api/auth/callback/twitch' : 'https://petruquio.live/api/auth/callback/twitch';

    let twitchTokens = await exchangeCode(clientId, clientSecret, code, redirectUri)




    try {
        // Validar el access_token con Twitch
        const tokenValid = await axios.get('https://id.twitch.tv/oauth2/validate', {
            headers: {
                Authorization: `Bearer ${twitchTokens.accessToken}`
            }
        });

        if (!tokenValid) {
            return res.status(401).json({ message: 'Access token is invalid' });
        } else {
            // Obtener información del usuario desde Twitch
            const userInfo = await axios.get('https://api.twitch.tv/helix/users', {
                headers: {
                    Authorization: `Bearer ${twitchTokens.accessToken}`,
                    'Client-Id': process.env.TWITCH_CLIENT_ID
                }
            });

            const { id, login, email } = userInfo.data.data[0];
            const { display_name, profile_image_url, description, broadcaster_type } = userInfo.data.data[0];

            if (!userInfo) {
                return res.status(401).json({ message: 'Failed to get user info from Twitch' });
            }

            let user = await User.findOrCreate(id, login, email, {
                display_name,
                broadcaster_type,
                description,
                profile_image_url
            });

            const banned = await BotModel.isBanned(id);


            let profile = await user.getProfile();


            // Guardar el access_token y refresh_token en la base de datos
            authProvider.addUser(user.twitchId, twitchTokens)

            let token = await UserToken.findByUserId(user.id);
            if (token) {
                await UserToken.update(user.id, twitchTokens);
            } else {
                await UserToken.create(user.id, twitchTokens);
            }

            // Crear la sesión del usuario en la base de datos
            const session = await Session.create(user.id, {}, {}, null);
            console.log(`Created session ${session.sessionId} for user ${user.login} (${user.id})`);

            user = {
                ...user,
                profile
            }

            merge(user, { session_id: session.sessionId });

            if (banned) {
                user.banned = true;
            }

            // Crear un JWT personalizado para el usuario
            const customToken = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Enviar el JWT personalizado al cliente
            res.json({ token: customToken });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to get token from Twitch' });
    }
});

AccountsRouter.get("/me", passport.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user;

    res.json({ user });
});

//AccountsRouter

AccountsRouter.get("/session", passport.authenticate('jwt', { session: false }), async (req, res) => {
    let user = req.user;
    const banned = await BotModel.isBanned(user.twitchId);
    const session = await Session.findBySessionId(user.session_id);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (session.impersonatedUserId) {
        const impersonatedUser = await User.findById(session.impersonatedUserId);
        if (impersonatedUser) {
            const impersonatedProfile = await impersonatedUser.getProfile();
            user = merge(impersonatedUser, { profile: impersonatedProfile }, { session_id: session.sessionId }, { impersonated: true });
        }
    }

    if (user) {
        user.banned = banned ? true : false;
        res.json({ user });
    }
    else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

AccountsRouter.delete("/session", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const user = req.user;
    const session = await Session.findBySessionId(user.session_id);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    await session.revokeCurrent();

    res.json({ status: 'ok' });
});

AccountsRouter.get("/:provider/connect", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const user = req.user;
    const provider = req.params.provider;
    const session = await Session.findBySessionId(user.session_id);
    console.log(session);
    if (!session.sessionId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    switch (provider) {
        case 'discord':
            const discordScopes = ["identify", "email", "connections", "guilds", "guilds.join"];
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.NODE_ENV === 'production' ? 'https://petruquio.live/auth/discord/callback' : 'http://localhost:8888/auth/discord/callback'}&response_type=code&scope=${discordScopes.join('%20')}&prompt=consent`;
            return res.send(discordAuthUrl);
        default:
            return res.status(404).json({ message: 'Provider not found' });
    }
});

AccountsRouter.get("/discord/callback", passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    passport.authorize('discord', { session: false }, async (err, profile, info) => {
        let user = req.user;
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to connect Discord account' });
        }

        if (!user) {
            return res.status(500).json({ message: 'Failed to connect Discord account' });
        }




        const currentUser = await User.findById(user.id);
        console.log(currentUser);
        console.log(profile);

        let connect = await currentUser.connectExternalProvider('discord', profile.id, profile.accessToken, null, profile);
        if (!connect) {
            return res.status(500).json({ message: 'Failed to connect Discord account' });
        }

        return res.json({ status: 'ok' });
    }
    )(req, res, next);
});






export default AccountsRouter;
