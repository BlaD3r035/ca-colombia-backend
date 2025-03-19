const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');

const sessionStore = new MySQLStore({}, db);

sessionStore.on('error', function (error) {
    console.error('Session store error:', error);
});

const sessionMiddleware = session({
    key: 'user_session',
    secret: process.env.COCKIE_KEY,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
});

module.exports = sessionMiddleware;