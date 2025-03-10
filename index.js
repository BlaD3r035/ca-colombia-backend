const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app = express();
const db = require('./db/db');

// Configuración de CORS
app.use(cors())

// Configuración de vistas y archivos estáticos
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// Swagger Docs


// Middleware de análisis de datos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas de la API
const routes = require('./routes/routes');
app.use('/v1', routes);
const login = require('./routes/login');
app.use('/v1', login);
const userDatas = require('./routes/get_ids');
app.use('/v1', userDatas);
const allUserData = require('./routes/get_database_user_data');
app.use('/v1', allUserData);
const Ticket = require('./routes/add_records_tickets');
app.use('/v1', Ticket);
const records = require('./routes/add_records');
app.use('/v1', records);
const licence = require('./routes/licence_modify');
app.use('/v1', licence);
const impoundments = require('./routes/Impoundments')
app.use('/v1',impoundments)
const denunciaAdd = require('./routes/denuncias/denuncias');
app.use('/v1/denuncias', denunciaAdd);

// Rutas públicas
const mainpage = require('./routes/mainpage');
app.use('/', mainpage);
const get_records = require('./public_routes/get_records');
app.use('/public/v1', get_records);

// Configuración de sesiones con MySQL
const sessionStore = new MySQLStore({}, db);
sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});

// Iniciar servidor
app.listen(8080, () => {
    console.log('🚀 Server started on port 8080');
});
