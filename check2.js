const {DataSource} = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
});
ds.initialize().then(async () => {
  const tables = await ds.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ', ['public']);
  console.log('Tables:', JSON.stringify(tables));
  ds.destroy();
}).catch(e => console.error('ERROR:', e.message));
