import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

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

            let userWithProfile = {
                ...user,
                profile,
                session_id: session.sessionId
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

export default passport;
