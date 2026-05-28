const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'MotoExpert',
});

async function createServices() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    const services = [
      // MOTOS
      { nombre: 'Lavado Básico Moto', precio: 15000, duracion: 30, tipoVehiculo: 'Moto', descripcion: 'Lavado exterior básico para motos' },
      { nombre: 'Lavado Premium Moto', precio: 25000, duracion: 60, tipoVehiculo: 'Moto', descripcion: 'Lavado detallado con cera para motos' },
      { nombre: 'Limpieza de Cadena', precio: 10000, duracion: 20, tipoVehiculo: 'Moto', descripcion: 'Limpieza y lubricación de cadena' },
      
      // AUTOS
      { nombre: 'Lavado Básico Auto', precio: 30000, duracion: 45, tipoVehiculo: 'Auto', descripcion: 'Lavado exterior e interior básico para autos' },
      { nombre: 'Lavado Premium Auto', precio: 50000, duracion: 90, tipoVehiculo: 'Auto', descripcion: 'Lavado detallado, aspirado y polichado para autos' },
      { nombre: 'Lavado de Motor Auto', precio: 40000, duracion: 60, tipoVehiculo: 'Auto', descripcion: 'Limpieza técnica de motor para autos' },

      // CAMIONETAS
      { nombre: 'Lavado Básico Camioneta', precio: 45000, duracion: 60, tipoVehiculo: 'Camioneta', descripcion: 'Lavado completo para camionetas y SUVs' },
      { nombre: 'Lavado Premium Camioneta', precio: 70000, duracion: 120, tipoVehiculo: 'Camioneta', descripcion: 'Detallado profundo para camionetas' },
      { nombre: 'Tratamiento de Chasis', precio: 55000, duracion: 90, tipoVehiculo: 'Camioneta', descripcion: 'Lavado y protección de chasis para 4x4' }
    ];

    for (const s of services) {
      // Verificar si ya existe por nombre
      const exists = await client.query('SELECT id FROM servicios WHERE nombre = $1', [s.nombre]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO servicios (nombre, precio, duracion, "tipoVehiculo", descripcion, "duration_minutes") VALUES ($1, $2, $3, $4, $5, $6)',
          [s.nombre, s.precio, s.duracion, s.tipoVehiculo, s.descripcion, s.duracion]
        );
        console.log(`Servicio creado: ${s.nombre}`);
      } else {
        console.log(`El servicio ya existe: ${s.nombre}`);
      }
    }

    console.log('Proceso de creación de servicios finalizado');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

createServices();
