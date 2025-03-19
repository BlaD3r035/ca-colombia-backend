const mysql = require('mysql2');
const axios = require('axios');

const DISCORD_WEBHOOK_URL = process.env.DENUNCIAS_URL_WEBHOOK;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
}).promise();

function sendDiscordWebhook(message) {
    axios.post(DISCORD_WEBHOOK_URL, { content: message })
        .then(() => console.log('Mensaje enviado a Discord'))
        .catch(err => console.error('Error al enviar mensaje a Discord:', err));
}

pool.getConnection()
    .then(connection => {
        const successMessage = `✅ Conectado a la base de datos MySQL con ID ${connection.threadId}`;
        console.log(successMessage);
        sendDiscordWebhook(successMessage);
        connection.release();
    })
    .catch(err => {
        const errorMessage = `❌ Error al conectar a la base de datos: ${err.message}`;
        console.error(errorMessage);
        sendDiscordWebhook(errorMessage);
    });

module.exports = pool;
