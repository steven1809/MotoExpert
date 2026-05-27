
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/servicios',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n--- Raw response data ---');
    console.log(data);
    console.log('\n--- Attempting to parse JSON ---');
    try {
      const parsed = JSON.parse(data);
      console.log('✅ JSON parsed successfully!');
      console.log('Number of servicios in data:', parsed.data.length);
    } catch (err) {
      console.error('❌ JSON parse error:', err.message);
      console.error('Error at position:', err.message.match(/position (\d+)/)?.[1]);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
