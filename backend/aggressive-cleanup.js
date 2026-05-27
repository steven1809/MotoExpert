
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'MotoExpert',
});

const clean = (text) => {
  if (text === null || text === undefined) return text;
  return String(text)
    .split(/[\r\n]+/).join(' ') // replace any line break sequences
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
};

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const { rows } = await client.query('SELECT id, nombre, descripcion, incluye, beneficios FROM servicios ORDER BY id');
    console.log('Found servicios to check:', rows.length);

    for (const s of rows) {
      const newDesc = clean(s.descripcion);
      const newIncluye = clean(s.incluye);
      const newBeneficios = clean(s.beneficios);

      if (newDesc !== s.descripcion || newIncluye !== s.incluye || newBeneficios !== s.beneficios) {
        console.log(`Updating servicio id ${s.id} (${s.nombre})`);
        await client.query(
          'UPDATE servicios SET descripcion = $1, incluye = $2, beneficios = $3 WHERE id = $4',
          [newDesc, newIncluye, newBeneficios, s.id]
        );
      }
    }

    console.log('Done! All servicios cleaned!');
    await client.end();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

run();
