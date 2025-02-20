const mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: '38.46.216.61',
    user: 'cacolom1_backend',
    password: 'c].QOXc+gX!J',
    database: 'cacolom1_bot'
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