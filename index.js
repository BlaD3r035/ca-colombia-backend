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