const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function updateColumn() {
  try {
    await client.connect();
    console.log('Conectado a BD');

    // Cambiar el tipo de columna usuarioId a bigint
    await client.query('ALTER TABLE vehiculos ALTER COLUMN "usuarioId" TYPE bigint');
    console.log('Columna usuarioId cambiada a bigint');

    // Verificar el cambio
    const result = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vehiculos' AND column_name = 'usuarioId'");
    console.log('Nueva definición:', result.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.end();
  }
}

updateColumn();