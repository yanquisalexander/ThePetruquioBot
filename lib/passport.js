import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import User from '../app/models/User.js';

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secretofdevenvironment'
};

passport.use('jwt',
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            
            const user = await User.findOrCreate(payload.user.twitch_id, payload.user.username, payload.user.email);
            const profile = await User.getProfile(user.id);
            let userWithProfile = {
                ...user,
                profile
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
