import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as DiscordStrategy } from "@soerenmetje/passport-discord";

const discordScopes = ["identify", "email", "connections", "guilds", "guilds.join"];




import User from '../app/models/User.js';
import Session from '../app/models/Session.js';

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secretofdevenvironment'
};

passport.use('jwt',
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const session = await Session.findBySessionId(payload.user.session_id);
            if (!session) {
                return done(null, false, { message: 'Invalid session' });
            }

            const user = await User.findOrCreate(payload.user.twitchId, payload.user.username, payload.user.email);
            const profile = await user.getProfile();
            const connectedAccounts = await user.getConnectedAccounts();

            let userWithProfile = {
                ...user,
                profile,
                session_id: session.sessionId,
            }
            if (connectedAccounts) {
                userWithProfile.connectedAccounts = {};
                // connectedAccounts debe ser un array de objetos con la siguiente forma:
                // connectedAccounts = [
                //     discord: {}
                //     twitch: {}
                //]
                // Cada proveedor tiene una identificación única, por ejemplo, para Discord es "1"
                // y para Twitch es "2"



                connectedAccounts.map((account) => {
                    switch (account.provider_id) {
                        case 1:
                            userWithProfile.connectedAccounts['discord'] = account;
                            break;
                    }
                })
            }





            if (userWithProfile) {
                return done(null, userWithProfile);
            } else {
                return done(null, false);
            }
        } catch (error) {
            console.error(error);
            return done(error);
        }
    })
);

passport.use('discord', new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' ? 'https://petruquio.live/auth/discord/callback' : 'http://localhost:8888/auth/discord/callback',
    scope: discordScopes,
    prompt: 'consent',
}, async (accessToken, refreshToken, profile, callback) => {
    try {

        return callback(null, profile);
    } catch (error) {
        console.log(error);
        return callback(error); // Asegúrate de llamar a callback con el error como argumento

    }
}));




export default passport;
