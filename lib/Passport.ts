import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import "dotenv/config";
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
const SpotifyStrategy = require('passport-spotify').Strategy;
const DiscordStrategy = require('@soerenmetje/passport-discord').Strategy;
const PatreonStrategy = require('@oauth-everything/passport-patreon').Strategy;

import User from '../app/models/User.model';
import Session from '../app/models/Session.model';
import chalk from "chalk";
import Environment from "../utils/environment";
import AdminDashboardProblems, { ProblemSeverity } from "../app/models/admin/DashboardProblems.model";

const Scopes = {
    DISCORD: ["identify", "email", "connections", "guilds", "guilds.join"],
    // We only use spotify to get the user currently playing song
    SPOTIFY: ["user-read-email", "user-read-playback-state", "user-read-currently-playing"],
    PATREON: ["identity", "identity[email]", "identity.memberships"]
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
        AdminDashboardProblems.addProblem({
            id: `passport-${strategy}-strategy`,
            title: `Cannot setup ${strategy} strategy`,
            description: `Looks like you are missing some environment variables to setup the ${strategy} strategy. Please check the logs for more information.`,
            severity: ProblemSeverity.WARNING,
        });
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
        passReqToCallback: true,
    }

    public static async setup(): Promise<void> {
        console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('Setting up passport...'));
        console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('Setting up JWT strategy...'));
        // @ts-ignore
        passport.use('jwt', new JwtStrategy(this.jwtOptions, async (req, payload, done) => {
            console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('JWT strategy called'));
            console.log(chalk.bgCyan.bold('[PASSPORT]'), chalk.white('Payload:'), payload);
        
            try {
                const isSystemToken = payload.systemToken || false;
        
                if (isSystemToken) {
                    const token = req.headers.authorization?.replace('Bearer ', '');
                    const isTokenRevoked = await User.isTokenRevoked(token);
        
                    if (isTokenRevoked) {
                        return done(null, false, { message: 'This API token has been revoked' });
                    }
                }
        
                let session: Session | null = null;
        
                if (!isSystemToken) {
                    session = await Session.findBySessionId(payload.sessionId);
        
                    if (!session) {
                        return done(null, false, { message: 'Invalid session' });
                    }
                }
        
                const user = await User.findByTwitchId(payload.userId);
        
                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }
        
                const channel = await user.getChannel();
                const linkedAccounts = await user.getLinkedAccounts();
                const accounts = linkedAccounts.map((account) => ({
                    account_id: account.accountId,
                    provider: account.provider,
                    metadata: account.metadata,
                    expires_at: account.expiresAt,
                }));

                const unreads = await user.getUnreadNotificationsCount();
                const isPatron = await user.isPatron();
        
                const userData = {
                    ...user,
                    session: isSystemToken ? null : session,
                    channel,
                    linkedAccounts: accounts,
                    system_token: isSystemToken,
                    unread_notifications_count: unreads,
                    is_patron: isPatron,
                };

        
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

        if (strategyCanBeConfigured('discord')) {
            console.log('[PASSPORT] Configuring Discord strategy...');

            passport.use('discord', new DiscordStrategy({
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: process.env.DISCORD_CALLBACK_URL,
                scope: Scopes.DISCORD,
                prompt: 'consent',
            },
                // @ts-ignore
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        return done(null, profile, { accessToken, refreshToken });
                    } catch (error) {
                        console.error(error);
                        return done(error, false, { message: 'Internal server error' });
                    }
                }));
            console.log('[PASSPORT] Discord strategy configured.');
        }

        if (strategyCanBeConfigured('patreon')) {
            console.log('[PASSPORT] Configuring Patreon strategy...');

            passport.use('patreon', new PatreonStrategy({
                clientID: process.env.PATREON_CLIENT_ID,
                clientSecret: process.env.PATREON_CLIENT_SECRET,
                callbackURL: process.env.PATREON_CALLBACK_URL,
                scope: Scopes.PATREON,
                prompt: 'consent',
            },
                // @ts-ignore
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        return done(null, profile, { accessToken, refreshToken });
                    } catch (error) {
                        console.error(error);
                        return done(error, false, { message: 'Internal server error' });
                    }
                }));
            console.log('[PASSPORT] Patreon strategy configured.');
        }

        console.log('[PASSPORT] Finished setting up passport.');
    }

    public static getPassport(): typeof passport {
        return this.passport;
    }

    public static async middleware (req: Request, res: Response, next: NextFunction): Promise<void> {
        passport.authenticate('jwt', { session: false }, (err: Error, user: User) => {
          if (err || !user) {
            console.error(chalk.red('[PASSPORT]'), err);
            res.status(401).json({
              errors: [
                "Looks like you're not authenticated. Please log in and try again."
              ],
              error_type: err
            })
          } else {
            req.user = user
            next()
          }
        })(req, res, next)
      }
    }

export default Passport;