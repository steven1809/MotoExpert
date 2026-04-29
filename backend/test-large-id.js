const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testLargeId() {
  try {
    await client.connect();
    console.log('Conectado a BD');

    // Probar insertar un vehículo con ID de usuario muy largo
    const largeId = '999999999999999999'; // 18 dígitos
    const result = await client.query(
      'INSERT INTO vehiculos (placa, marca, modelo, "usuarioId") VALUES ($1, $2, $3, $4) RETURNING *',
      ['TEST-LARGE', 'Test', 'Large ID', largeId]
    );
    console.log('Vehículo creado con ID largo:', result.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.end();
  }
}

testLargeId();