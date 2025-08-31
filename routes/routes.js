const express = require('express');
const session = require('express-session');
const router = express.Router();
const MySQLStore = require('express-mysql-session')(session);
const db = require('../db/db');
const { render } = require('ejs');
//session
const sessionStore = new MySQLStore({}, db);
const jwt = require('jsonwebtoken')
const SECRET_KEY= process.env.SECRET_KEY

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
function iscookieAuth(req, res, next) {
    if (req.cookies.runt_token) {
        const decoded = jwt.decode(req.cookies.runt_token,SECRET_KEY)
        if(decoded.userdata){
            return next(); 
        }
        return res.status(401).json({message:"no authorized"})
    } else {
        
        return res.redirect('/v1/runt/login'); 
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
router.get('/runt',(req,res) =>{
    return res.redirect('/v1/runt/login')
})
router.get('/runt/login',(req,res)=>{
    if (req.cookies.runt_token) {
        const decoded = jwt.decode(req.cookies.runt_token,SECRET_KEY)
        if(decoded.userdata){
          return res.redirect('/v1/runt/dashboard')
        }}
        return res.render('runt_login')
})
router.get('/runt/dashboard',iscookieAuth,(req,res)=>{
   const decoded = jwt.decode(req.cookies.runt_token,SECRET_KEY)
   return res.render('runt_dashboard',{userdata:decoded.userdata})
})

router.get('/runt/vehicletransfer', async (req, res) => {
    const { code, documentId } = req.query;

    if (!code || !documentId) {
        return res.status(400).json({ message: "Missing required parameters: code and documentId" });
    }

    try {
        const [personresult] = await db.query('SELECT * FROM users WHERE roblox_id =?',[documentId])
        if(personresult.length === 0){
            return res.status(404).json({message:'La persona no tiene cedula'})
        }
        const userId = personresult[0].user_id
        const [results] = await db.query(
            'SELECT * FROM vehiculos WHERE owner = 0 AND idTransfer = ? AND code = ? AND transfer = 1 AND maxTransDate > NOW()',
            [userId, code]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "Esta transferencia no existe o ya expiró" });
        }
        const [sellerdata] = await db.query('SELECT * FROM users WHERE user_id =?',[results[0].orgId])
        if (sellerdata.length === 0) {
            return res.status(404).json({ message: "El propietario no cuenta con una cedula vigente" });
        }

         return res.status(200).render('runt_vehicle_transfer',{vehicle:results[0],userId:userId,seller:sellerdata[0]});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = router