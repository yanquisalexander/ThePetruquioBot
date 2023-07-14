import axios from "axios";
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../../app/models/User.js";
import UserToken from "../../app/models/UserToken.js";
import passport from "../../lib/passport.js";

const AccountsRouter = Router();

AccountsRouter.post("/get-token", async (req, res) => {
    // Aquí puedes realizar la lógica para obtener el access_token desde Twitch
    console.log(req.body);
    const code = req.body.code;

    let twitchTokens = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NODE_ENV === 'development' ? 'http://localhost:8888/api/auth/callback/twitch' : 'https://petruquio.live/api/auth/callback/twitch'
    })

    twitchTokens = twitchTokens.data




    try {
        // Validar el access_token con Twitch
        const tokenValid = await axios.get('https://id.twitch.tv/oauth2/validate', {
            headers: {
                Authorization: `Bearer ${twitchTokens.access_token}`
            }
        });

        if (!tokenValid) {
            return res.status(401).json({ message: 'Access token is invalid' });
        } else {
            // Obtener información del usuario desde Twitch
            const userInfo = await axios.get('https://api.twitch.tv/helix/users', {
                headers: {
                    Authorization: `Bearer ${twitchTokens.access_token}`,
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
            

            let profile = await user.getProfile();

            user = {
                ...user,
                profile
            }

            let token = await UserToken.findByUserId(user.id);
            UserToken.update
            if (token) {
                await UserToken.update(user.id, twitchTokens.access_token, twitchTokens.refresh_token);
            } else {
                await UserToken.create(user.id, twitchTokens.access_token, twitchTokens.refresh_token);
            }

            // Crear un JWT personalizado para el usuario
            const customToken = jwt.sign({user}, process.env.JWT_SECRET, { expiresIn: '30d' });

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
  

export default AccountsRouter;
