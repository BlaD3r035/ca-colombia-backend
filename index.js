const express = require('express')
const ejs = require('ejs')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app= express()
const db = require('./db/db')
//public and views 
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

//middlewarte
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//router

const routes = require('./routes/routes');
app.use('/v1',routes)
const login = require('./routes/login');
app.use('/v1',login)
const userDatas = require('./routes/get_ids');
app.use('/v1',userDatas)
const allUserData = require('./routes/get_database_user_data');
app.use('/v1',allUserData)
const insert_database = require('./routes/insert_database');
app.use('/v1',insert_database)

const sessionStore = new MySQLStore({}, db);
sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});

app.listen('8080',()=>{
    console.log('server started')
})