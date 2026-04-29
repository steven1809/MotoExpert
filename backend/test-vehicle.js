const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function test() {
  try {
    await client.connect();
    console.log('Conectado a BD');

    // Obtener primer usuario
    const userResult = await client.query('SELECT id, nombre FROM usuarios LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('No hay usuarios');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log('Usuario encontrado:', userResult.rows[0]);

    // Crear vehículo de prueba
    const insertResult = await client.query(
      'INSERT INTO vehiculos (placa, marca, modelo, "anio", color, "usuarioId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['ABC-123', 'Toyota', 'Corolla', 2020, 'Rojo', userId]
    );

    console.log('Vehículo creado:', insertResult.rows[0]);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();