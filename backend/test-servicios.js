
require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'MotoExpert',
});

async function testServicios() {
  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('--- All servicios ---');
    const allResult = await client.query('SELECT * FROM servicios ORDER BY id');
    console.table(allResult.rows);

    console.log('\n--- Servicio id=5 specifically ---');
    const result5 = await client.query('SELECT * FROM servicios WHERE id=5');
    console.log('Row:', result5.rows[0]);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testServicios();
