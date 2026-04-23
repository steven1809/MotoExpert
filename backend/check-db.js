const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'root',
  database: 'postgres',
});

async function checkConnection() {
  try {
    await client.connect();
    console.log('CONEXION_EXITOSA');
    await client.end();
  } catch (err) {
    console.error('ERROR_CONEXION:', err.message);
    process.exit(1);
  }
}

checkConnection();
