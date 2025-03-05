const express = require('express');
const session = require('express-session');
const router = express.Router();
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');
const axios = require('axios');
const querystring = require('querystring');
// Session configuration
const sessionStore = new MySQLStore({}, db);

sessionStore.on('error', function (error) {
    console.error('Session store error:', error);
});

router.use(session({
    key: 'user_session',
    secret: 'Xsdh19XfdjEeKLdjPorfbewd12',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Discord OAuth2 Config
const CLIENT_ID = '1279160842109321236';
const CLIENT_SECRET = 'XY6YNIj7tujHs7LLkThGOV9LU8tfUHHz';
const REDIRECT_URI = 'http://localhost.8080/v1/auth/discord/callback';
const DISCORD_API_URL = 'https://discord.com/api';

// Login Route
router.get('/login/error', (req, res) => {
    const { error } = req.query;
    res.render('login', { message: error || 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
});

router.post('/login', async (req, res) => {
    const { docId, password, userId } = req.body;

    try {
        if (password && docId) {
            const [user] = await db.query('SELECT docId, userId FROM cedulas WHERE documentId = ?', [docId]);
            if (user.length === 0) {
                return res.redirect('/v1/login/error?error=Usuario%20no%20encontrado');
            }
            if (['DITRAMACONDO3001', 'PONALCIENAGA4001', 'CTIMELQUIADES8001', 'EJERCITOBUENDIA6001', 'INPECRIOHACHA2001'].includes(password)) {
                req.session.loggedin = true;
                req.session.userdata = user[0];
                return res.redirect('/v1/dashboard');
            } else {
                return res.redirect('/v1/login/error?error=Contrase%C3%B1a%20incorrecta');
            }
        }

        if (userId) {
            const [user] = await db.query('SELECT * FROM cedulas WHERE userId = ?', [userId]);
            if (user.length === 0) {
                return res.status(200).json('No_auth');
            }
            const url = `${DISCORD_API_URL}/v10/guilds/1042099714608345159/members/${userId}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bot MTI3OTE2MDg0MjEwOTMyMTIzNg.G9lmz5.wL4Z5zba7QkQoyky70LwpOgrC_oOaYEZG_T-oA`,
                    'Content-Type': 'application/json',
                },
            });
        
            const roleList = ['1042099715031961749', '1042099715052949535', '1042099715052949539', '1042099715052949538', '1042099715052949537', '1068770548311658577', '1229429878382919680'];
            const hasRole = response.data.roles.some(role => roleList.includes(role));
            
            if (hasRole) {
                req.session.loggedin = true;
                req.session.userdata = user[0];
                return res.status(200).json(user[0]);
            } else {
                return res.status(200).json('No_auth');
            }
        }else{
            return res.status(200).json('No_auth');
        }
    } catch (err) {
        console.error('Login error:', err);
        return res.status(200).json('No_auth');
    }
});

// Discord Login Route
router.get('/auth/discord', (req, res) => {
    const authURL = `${DISCORD_API_URL}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    res.redirect(authURL);
});

// Discord Callback Route
router.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.redirect('/v1/login/error?error=Acceso%20no%20Autorizado');
    }

    try {
        const tokenResponse = await axios.post(
            `${DISCORD_API_URL}/oauth2/token`,
            querystring.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userResponse.data;
        const loginResponse = await axios.post('http://localhost:8080/v1/login', { userId: user.id });

        if (loginResponse.data === 'No_auth') {
            return res.redirect('/v1/login/error?error=No%20autorizado');
        } else {
            req.session.loggedin = true;
            req.session.userdata = loginResponse.data;
            return res.redirect('/v1/dashboard');
        }
    } catch (error) {
        console.error('Error durante la autenticación con Discord:', error);
        return res.redirect('/v1/login/error?error=Error%20en%20autenticaci%C3%B3n');
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.send('Sesión cerrada');
    });
});

module.exports = router;
