require('dotenv').config()
const {createServer} = require('node:http')
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app = express();
const server = createServer(app)
const db = require('./db/db');
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const axios = require('axios')
const {Server} = require('socket.io')
const io = new Server(server)

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
const runt = require('./routes/runt/login')
app.use('/v1/runt',runt)
// Rutas públicas
const mainpage = require('./routes/mainpage');
app.use('/', mainpage);
const get_records = require('./public_routes/get_records');
app.use('/public/v1', get_records);
const economy = require('./routes/economy')
app.use('/v1',economy)
const services = require('./routes/runt/services.js')
app.use('/v1/runt',services)
// Configuración de sesiones con MySQL
const sessionStore = new MySQLStore({}, db);
sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});

//function
const {checkLicenses,checkVehicles} = require('./functions/bucle/bucle.js')
setInterval(checkLicenses,   20 *60 * 1000);
setInterval(checkVehicles, 40 * 60 * 1000);


// Iniciar servidor
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('register_agent', ({ agentId, agentName }) => {
        connectedUsers.set(socket.id, agentName);
        
        io.emit('user joined', {  
            message: `El usuario ${agentName} se ha conectado`,
            activeUsers: connectedUsers.size 
        });
    });

    socket.on('chat message', ({ message, name, UID, timestamp }) => {
        if (!message || !name || !UID || !timestamp) {
            console.log("Invalid message data received");
            return;
        }
        socket.broadcast.emit('chat message', { message, name, UID, timestamp });
    });

    socket.on('disconnect', () => {
        const agentName = connectedUsers.get(socket.id) || "Un usuario";
        connectedUsers.delete(socket.id);
        console.log(`User disconnected: ${socket.id} (${agentName})`);

        io.emit('user left', { 
            userId: socket.id, 
            message: `El usuario ${agentName} se ha desconectado`,
            activeUsers: connectedUsers.size  
        });
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log('🚀 Server started on port 8080');
});
