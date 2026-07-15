#!/usr/bin/env node
import fs from 'fs';

const API = 'http://localhost:3000/api';

async function loginAdmin(){
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stockflow.local', password: 'AdminPass123!' })
  });
  if(res.status !== 200) throw new Error('Admin login failed: ' + res.status);
  const data = await res.json();
  return data.token;
}

// tiny transparent png base64 1x1
const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

async function run(){
  try{
    const token = await loginAdmin();
    console.log('Admin token acquired');

    const prodRes = await fetch(`${API}/stock/products`);
    if(prodRes.status !== 200) throw new Error('/api/stock/products failed: ' + prodRes.status);
    const products = await prodRes.json();
    console.log('Products fetched:', products.length);

    const toTest = products.slice(0, 5);
    const results = [];
    for(const p of toTest){
      console.log('Uploading photo for', p.reference, p.id);
      const body = { photo_base64: tinyPng, filename: `test-${p.reference}.png` };
      const upl = await fetch(`${API}/stock/${p.id}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const j = await upl.json().catch(()=>null);
      console.log('->', upl.status, j && j.photo_url);
      results.push({ id: p.id, reference: p.reference, status: upl.status, photo_url: j && j.photo_url });
    }

    fs.writeFileSync('./backend/upload_test_results.json', JSON.stringify(results, null, 2));
    console.log('Results saved to backend/upload_test_results.json');
  }catch(e){
    console.error('Upload test failed', e.stack || e.message || e);
    process.exit(1);
  }
}

run().then(()=>process.exit(0));
