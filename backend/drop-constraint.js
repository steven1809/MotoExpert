const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function dropConstraint() {
  try {
    await client.connect();
    console.log('Conectado a BD');

    // Quitar la restricción de llave foránea
    await client.query('ALTER TABLE vehiculos DROP CONSTRAINT IF EXISTS "FK_0f7d727d6f52e7426278ae3f03d"');
    console.log('Restricción de llave foránea removida');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.end();
  }
}

dropConstraint();