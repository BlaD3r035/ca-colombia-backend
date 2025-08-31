const mysql = require('mysql2');
const axios = require('axios');

const DISCORD_WEBHOOK_URL = process.env.DENUNCIAS_URL_WEBHOOK;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
}).promise();



pool.getConnection()
    .then(connection => {
        const successMessage = `✅ Conectado a la base de datos MySQL con ID ${connection.threadId}`;
        console.log(successMessage);
        connection.release();
    })
    .catch(err => {
        const errorMessage = `❌ Error al conectar a la base de datos: ${err.message}`;
        console.error(errorMessage);
    });

module.exports = pool;
