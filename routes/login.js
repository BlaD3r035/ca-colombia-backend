const express = require('express');
const session = require('express-session');
const router = express.Router();
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');
const { render } = require('ejs');
//session
const sessionStore = new MySQLStore({}, db);

sessionStore.on('error', function(error) {
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


//routes
 
router.post('/login', async (req, res) => {
    const { docId, password } = req.body;
    
    const [user] = await db.query('SELECT * FROM cedulas WHERE documentId =?',[docId])
    if(user.length === 0){
        return res.render('login',{message:'usuario incorrecto'})
    }else{
        if(password ==='3001'|| password === '4001'){
            req.session.loggedin = true;                
            req.session.userdata = user[0];
            return res.redirect('/v1/dashboard')
        }else{
            return res.render('login',{message:'contraseña incorrecta'})
        }
        
        
   }
 
});




module.exports = router