
const express = require('express')
const session = require('express-session')
const ejs = require('ejs')
const cors  = require('cors')
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app= express()
const db = require('./db/db')
app.use(cors())
//public and views 
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

//middlewarte
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; 

function cooldownMiddleware(req, res, next) {
    const key = req.ip + req.originalUrl; 
    const now = Date.now();

    if (cooldowns.has(key)) {
        const lastRequestTime = cooldowns.get(key);
        if (now - lastRequestTime < COOLDOWN_TIME) {
            return res.status(429).json({ message: "Por favor, espera antes de volver a intentarlo." });
        }
    }

    cooldowns.set(key, now);
    setTimeout(() => cooldowns.delete(key), COOLDOWN_TIME); 
    next();
}



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//database routes
const routes = require('./routes/routes');
app.use('/v1',routes)
const login = require('./routes/login');
app.use('/v1',login)
const userDatas = require('./routes/get_ids');
app.use('/v1',userDatas)
const allUserData = require('./routes/get_database_user_data');
app.use('/v1',allUserData)
const Ticket = require('./routes/add_records_tickets');
app.use('/v1',cooldownMiddleware,Ticket)
const records = require('./routes/add_records');
app.use('/v1',cooldownMiddleware,records)
//DENUNCIAS 
const dennciaadd = require('./routes/denuncias/denuncias')
app.use('/v1/denuncias',cooldownMiddleware,dennciaadd)
//public routes
const mainpage = require('./routes/mainpage');
app.use('/',mainpage)
const get_records = require('./public_routes/get_records')
app.use('/public/v1', get_records)
//session storage
const sessionStore = new MySQLStore({}, db);
sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});
//start server
app.listen('8080',()=>{
    console.log('server started')
})