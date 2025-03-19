const mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    
}).promise();

pool.getConnection()
    .then(connection => {
        console.log('Conectado a la base de datos MySQL con ID ' + connection.threadId);
        connection.release(); 
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
    });

module.exports = pool;