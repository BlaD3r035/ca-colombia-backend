require('dotenv').config()
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app = express();
const db = require('./db/db');
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const axios = require('axios')

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
const deleteLicenciaQuery = 'DELETE FROM licencia WHERE userId = ?';
const updateLicenciaQuery = 'UPDATE licencia SET status = ?, editAt = NULL WHERE userId = ?';
const licenciaQuery = 'SELECT userId, status, removeAt, editAt FROM licencia';
const DISCORD_WEBHOOK_URL = process.env.RUNT_URL_WEBHOOK; 

async function checkLicenses() {
    try {
        const [licenciaResults] = await db.query(licenciaQuery);
        const now = new Date();

        for (const licencia of licenciaResults) {
            const userId = licencia.userId;
            const removeAt = licencia.removeAt ? new Date(licencia.removeAt) : null;
            const editAt = licencia.editAt ? new Date(licencia.editAt) : null;

            if (removeAt && now >= removeAt) {
                await db.query(deleteLicenciaQuery, [userId]);
                console.log(`Licencia de ${userId} eliminada por expiración.`);
                await sendDiscordNotification(userId, removeAt); // Enviar webhook
                continue;
            }

            if (licencia.status === "Suspendida" && editAt && now >= editAt) {
                await db.query(updateLicenciaQuery, ["Valida", userId]);
                console.log(`Licencia de ${userId} actualizada a Valida.`);
            }
        }
    } catch (error) {
        console.error('Error verificando licencias:', error);
    }
}
async function sendDiscordNotification(userId, removeAt) {
    const embed = {
        title: "❌ Licencia Expirada",
        description: `Tu licencia ha expirado y necesitas obtener una nueva.`,
        color: 0xff0000, // Rojo
        fields: [
            { name: "Usuario ID", value: `${userId}`, inline: true },
            { name: "Fecha de Expiración", value: `<t:${Math.floor(removeAt.getTime() / 1000)}:f>`, inline: true }
        ],
        footer: { text: "Sistema de Licencias RUNT" }
    };

    try {
        const response = await axios.post(DISCORD_WEBHOOK_URL, {content:`<@${userId}>`, embeds: [embed] });

        console.log(`Webhook enviado para usuario ${userId}.`);
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.data.retry_after || 1000; // Tiempo en ms
            console.warn(`Rate limit alcanzado. Reintentando en ${retryAfter}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return sendDiscordNotification(userId, removeAt); // Reintentar
        }

        console.error(`Error enviando webhook:`, error.message);
    }
}
async function checkVehicles() {
    try{
        const [vehicles] = await db.query('SELECT * FROM vehiculos WHERE transfer = 1')
        const now = new Date()
        vehicles.forEach(async(vehicle) =>{
          if(now > vehicle.maxTransDate){
            await db.query( 'UPDATE vehiculos SET owner = ?, idTransfer = null, orgId = null, transfer = null, maxTransDate = null, code = null WHERE placa = ?',
                [vehicle.orgId,vehicle.placa]
            )
            sendDiscordCarReq(vehicle.orgId,vehicle.placa)
          }
        })
    }catch(e){
        console.log("error mirando fechas de vehiculos " +e)
    }
  
}
async function sendDiscordCarReq(userId, placa) {
    const embed = {
        title: "❌ Traspaso expirado",
        description: `Su traspaso del vehiculo con placa ${placa} superó el tiempo de la solicitud.`,
        color: 0xff0000, // Rojo
       
        footer: { text: "Sistema  RUNT" }
    };

    try {
        const response = await axios.post(DISCORD_WEBHOOK_URL, {content:`<@${userId}>`, embeds: [embed] });

        console.log(`Webhook enviado para usuario ${userId}.`);
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.data.retry_after || 1000; // Tiempo en ms
            console.warn(`Rate limit alcanzado. Reintentando en ${retryAfter}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return sendDiscordCarReq(userId, placa); // Reintentar
        }

        console.error(`Error enviando webhook:`, error.message);
    }
}
setInterval(checkLicenses,   20 *60 * 1000);
setInterval(checkVehicles, 40 * 60 * 1000);


// Iniciar servidor
app.listen(process.env.PORT || 8080, () => {
    console.log('🚀 Server started on port 8080');
});
