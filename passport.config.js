'use strict';

const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const users = require('./data/users');

const options = {
    secretOrKey: 'secret',
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

passport.use(new JWTStrategy(options, async (payload, done) => {
    try {
        const user = users.find(user => user.email === payload.email); // Built-in higher-order function "find"

        return user ? done(null, user) : done(null, false, { message: 'Token is invalid' });
    } catch (error) {
        return done(error);
    }
}));