
require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'MotoExpert',
});

const cleanText = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/\r?\n/g, ' ') // replace newlines with space
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ') // replace multiple spaces with single
    .trim();
};

async function cleanup() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const result = await client.query('SELECT id, nombre, descripcion, incluye, beneficios FROM servicios ORDER BY id');
    console.log('Found servicios before cleanup:');
    console.table(result.rows.map(r => ({id: r.id, nombre: r.nombre, has_newline_desc: (r.descripcion || '').includes('\n') || (r.descripcion || '').includes('\r')}));

    const updates = [];

    for (const servicio of result.rows) {
      const updated = {
        descripcion: cleanText(servicio.descripcion),
        incluye: cleanText(servicio.incluye),
        beneficios: cleanText(servicio.beneficios),
      };

      if (updated.descripcion !== servicio.descripcion ||
          updated.incluye !== servicio.incluye ||
          updated.beneficios !== servicio.beneficios) {
        console.log(`Updating servicio id ${servicio.id} (${servicio.nombre})...');
        const updateResult = await client.query(
          'UPDATE servicios SET descripcion = $1, incluye = $2, beneficios = $3 WHERE id = $4 RETURNING *',
          [updated.descripcion, updated.incluye, updated.beneficios, servicio.id]
        );
        updates.push(updateResult.rows[0]);
      }
    }

    console.log('\nSuccessfully updated:', updates.length, 'servicios');
    if (updates.length > 0) {
      console.table(updates);
    }

    await client.end();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanup();
