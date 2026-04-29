require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'MotoExpert',
});

async function checkConnection() {
  try {
    await client.connect();
    console.log('CONEXION_EXITOSA');

    // Verificar si hay usuarios
    const result = await client.query('SELECT COUNT(*) as count FROM usuarios');
    console.log(`Usuarios en la base de datos: ${result.rows[0].count}`);

    await client.end();
  } catch (err) {
    console.error('ERROR_CONEXION:', err.message);
    process.exit(1);
  }
}

checkConnection();
