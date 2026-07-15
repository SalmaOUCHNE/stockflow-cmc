const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', () => resolve({ status: 'ERROR', body: '' }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 'TIMEOUT', body: '' }); });
    req.end();
  });
}

(async () => {
  console.log('Testing Stock Endpoints:');
  
  const endpoints = [
    '/api/stock/products',
    '/api/stock/poles',
    '/api/stock/filieres',
    '/api/stock/recent-movements'
  ];
  
  for (const endpoint of endpoints) {
    const res = await testEndpoint(endpoint);
    console.log(`${endpoint} → Status ${res.status}`);
    if (res.status === 200) {
      try {
        const json = JSON.parse(res.body);
        console.log(`  Items: ${Array.isArray(json) ? json.length : 'not array'}`);
      } catch { console.log(`  (invalid JSON)`); }
    }
  }
})();
