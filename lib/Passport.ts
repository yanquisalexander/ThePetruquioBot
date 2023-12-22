import passport from 'passport';
import "dotenv/config";
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
const SpotifyStrategy = require('passport-spotify').Strategy;

import User from '../app/models/User.model';
import Session from '../app/models/Session.model';
import chalk from "chalk";
import Environment from "../utils/environment";

const Scopes = {
    DISCORD: ["identify", "email", "connections", "guilds", "guilds.join"],
    // We only use spotify to get the user currently playing song
    SPOTIFY: ["user-read-email", "user-read-playback-state", "user-read-currently-playing"],
}

const strategyCanBeConfigured = (strategy: string) => {
    if (!process.env[`${strategy.toUpperCase()}_CLIENT_ID`]) {
        console.warn(chalk.yellow('[PASSPORT]'), chalk.white(`Missing ${strategy.toUpperCase()}_CLIENT_ID environment variable`));
    }
    if (!process.env[`${strategy.toUpperCase()}_CLIENT_SECRET`]) {
        console.warn(chalk.yellow('[PASSPORT]'), chalk.white(`Missing ${strategy.toUpperCase()}_CLIENT_SECRET environment variable`));
    }
    if (!process.env[`${strategy.toUpperCase()}_CALLBACK_URL`]) {
        console.warn(chalk.yellow('[PASSPORT]'), chalk.white(`Missing ${strategy.toUpperCase()}_CALLBACK_URL environment variable`));
    }

    if (!process.env[`${strategy.toUpperCase()}_CLIENT_ID`] || !process.env[`${strategy.toUpperCase()}_CLIENT_SECRET`] || !process.env[`${strategy.toUpperCase()}_CALLBACK_URL`]) {
        console.warn(chalk.yellow('[PASSPORT]'), chalk.white(`Cannot setup ${strategy} strategy`));
        return false;
    }

    return true;
}

class Passport {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }
    private static passport = passport;
    private static jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'secret',
    }

    public static async setup(): Promise<void> {
        console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('Setting up passport...'));
        console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('Setting up JWT strategy...'));
        passport.use('jwt', new JwtStrategy(this.jwtOptions, async (payload, done) => {
            try {
                const session = await Session.findBySessionId(payload.sessionId);
                if (!session) {
                    return done(null, false, { message: 'Invalid session' });
                }

                const user = await User.findByTwitchId(session.userId);
                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }

                const linkedAccounts = await user.getLinkedAccounts();

                let userData = {
                    ...user,
                    session,
                    channel: await user.getChannel(),
                    linkedAccounts,
                }

                return done(null, userData);
            } catch (error) {
                console.error(error);
                return done(error, false, { message: 'Internal server error' });
            }
        }));

        if (strategyCanBeConfigured('spotify')) {
            console.log('[PASSPORT] Configuring Spotify strategy...');

            passport.use('spotify', new SpotifyStrategy({
                clientID: process.env.SPOTIFY_CLIENT_ID,
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
                callbackURL: process.env.SPOTIFY_CALLBACK_URL,
                scope: Scopes.SPOTIFY,
                showDialog: true,
            },
                // @ts-ignore
                async (accessToken, refreshToken, expires_in, profile, done) => {
                    try {
                        return done(null, profile, { accessToken, refreshToken, expires_in });
                    } catch (error) {
                        console.error(error);
                        return done(error, false, { message: 'Internal server error' });
                    }
                }));
            console.log('[PASSPORT] Spotify strategy configured.');
        }

        console.log('[PASSPORT] Finished setting up passport.');
    }

    public static getPassport(): typeof passport {
        return this.passport;
    }
}

export default Passport;