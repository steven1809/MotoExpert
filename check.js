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
  const user = await ds.query('SELECT id, email, password, rol FROM usuario WHERE email =  LIMIT 1', ['iansteven1820@gmail.com']);
  console.log('User:', JSON.stringify(user));
  ds.destroy();
}).catch(e => console.error('ERROR:', e.message));
