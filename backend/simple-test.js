
const http = require('http');

async function testPort(port) {
  return new Promise((resolve, reject) => {
    console.log(`Testing http://localhost:${port}/servicios...`);
    http.get(`http://localhost:${port}/servicios`, (res) => {
      console.log('Port', port, '- Response status code:', res.statusCode);
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          console.log('✅ Port', port, '- SUCCESS: JSON parsed!');
          console.log('   Number of servicios in data:', parsed.data ? parsed.data.length : 0);
          resolve({ port, success: true, parsed });
        } catch (e) {
          console.error('❌ Port', port, '- ERROR parsing JSON:', e.message);
          resolve({ port, success: false, error: e });
        }
      });
    }).on('error', (e) => {
      console.error('❌ Port', port, '- ERROR making request:', e.message);
      resolve({ port, success: false, error: e });
    });
  });
}

Promise.all([testPort(3000), testPort(3001)]).then(results => {
  console.log('\n--- Final results ---');
  console.table(results.map(r => ({ port: r.port, success: r.success, error: r.success ? '' : r.error?.message })));
});
