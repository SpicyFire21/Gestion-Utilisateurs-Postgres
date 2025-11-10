const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
// le testage de la connextion 🤙
pool.on('connect', () => {
    console.log('Connecté à PostgreSQL');
});
// si la connexion a décidé de flop
pool.on('error', (err) => {
    console.error('Erreur PostgreSQL:', err);
});

module.exports = pool;
