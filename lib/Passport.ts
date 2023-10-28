import passport from 'passport';
import "dotenv/config";
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import User from '../app/models/User.model';
import Session from '../app/models/Session.model';

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

                let userData = {
                    ...user,
                    session,
                    channel: await user.getChannel()
                }

                return done(null, userData);

            } catch (error) {
                console.error(error);
                return done(error, false, { message: 'Internal server error' });
            }
        }));

        console.log('[PASSPORT] Finished setting up passport.');
    }

    public static getPassport(): typeof passport {
        return this.passport;
    }
}

export default Passport;