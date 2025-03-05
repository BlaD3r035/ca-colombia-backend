const express = require('express');
const session = require('express-session');
const router = express.Router();
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');
const { render } = require('ejs');
//session
const sessionStore = new MySQLStore({}, db);


const sessionMiddleware = require('../Middleware/sessionConfig');
router.use(sessionMiddleware);

//functions
//functions
function isAuthenticated(req, res, next) {
    if (req.session && req.session.loggedin) {
        return next(); 
    } else {
        
        return res.redirect('/v1/login'); 
    }
}
//routes
router.get('/', async (req,res) =>{
    res.redirect('/v1/login')
})

router.get('/login', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/v1/dashboard');
    }
    res.render('login');
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('database',{userdata: req.session.userdata})
})
module.exports = router