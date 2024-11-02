const mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: '38.46.216.103',
    user: 'cacolomb_policedatabase',
    password: '~;Ah&2O]nK3=',
    database: 'cacolomb_bot'
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