const express = require('express');
const session = require('express-session');
const router = express.Router();
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');
const axios = require('axios');
const querystring = require('querystring');
const sessionMiddleware = require('../Middleware/sessionConfig');

router.use(sessionMiddleware);

// Discord OAuth2 Config
const CLIENT_ID = '1279160842109321236';
const CLIENT_SECRET = 'XY6YNIj7tujHs7LLkThGOV9LU8tfUHHz';
const REDIRECT_URI = 'http://localhost:8080/v1/auth/discord/callback';
const DISCORD_API_URL = 'https://discord.com/api';
 const BOT_TOKEN ="MTI3OTE2MDg0MjEwOTMyMTIzNg.G9lmz5.wL4Z5zba7QkQoyky70LwpOgrC_oOaYEZG_T-oA"

const GUILD_ID = '1042099714608345159';
const ALLOWED_ROLES = [
    '1042099715031961749', '1042099715052949535', '1042099715052949539', 
    '1042099715052949538', '1042099715052949537', '1068770548311658577', '1229429878382919680'
];

// Helper function to check if user has required roles
const hasRequiredRole = (roles) => roles.some(role => ALLOWED_ROLES.includes(role));

// Discord Login Route
router.get('/auth/discord', (req, res) => {
    const authURL = `${DISCORD_API_URL}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    res.redirect(authURL);
});

// Discord Callback Route
router.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/v1/login/error?error=Acceso%20no%20Autorizado');

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
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const userId = userResponse.data.id;
        const [user] = await db.query('SELECT * FROM cedulas WHERE userId = ?', [userId]);
        if (user.length === 0) return res.redirect('/v1/login/error?error=No%20autorizado');

        const guildMemberResponse = await axios.get(`${DISCORD_API_URL}/guilds/${GUILD_ID}/members/${userId}`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });

        if (!hasRequiredRole(guildMemberResponse.data.roles)) return res.redirect('/v1/login/error?error=No%20autorizado');
        
        req.session.loggedin = true;
        req.session.userdata = user[0];
        req.session.roles = guildMemberResponse.data.roles;

        return res.redirect('/v1/dashboard');
    } catch (error) {
        console.error('Error durante la autenticación con Discord:', error);
        return res.redirect('/v1/login/error?error=Error%20en%20autenticaci%C3%B3n');
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Error al cerrar sesión');
        res.send('Sesión cerrada');
    });
});

module.exports = router;