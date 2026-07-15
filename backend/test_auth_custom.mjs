#!/usr/bin/env node

const API = 'http://localhost:3000/api';

async function run(){
  console.log('Custom auth/API tests starting');
  const report = { tests: [] };
  try{
    // 1. Login admin
    try{
      const res = await fetch(`${API}/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'admin@stockflow.local', password:'AdminPass123!'})});
      const status = res.status;
      const data = await res.json().catch(()=>({}));
      report.tests.push({name:'admin login', status, dataPresent: !!data.token});
      if(!data.token) throw new Error('admin login failed');
      const token = data.token;

      // 2. /users/me
      const meRes = await fetch(`${API}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      report.tests.push({name:'/users/me', status: meRes.status});
      const meData = await meRes.json().catch(()=>null);
      const adminUserId = meData?.id || null;

      // 3. Create a test product via API (if endpoint exists)
      // Try POST /api/products
      const productPayload = {
        reference: 'TEST-API-001-' + Date.now(),
        libelle: 'API Test Product',
        description: 'Created by automated test',
        category_id: null,
        unite_mesure: 'pièce',
        stock_actuel: 10,
        seuil_alerte: 2
      };
      let prodRes;
      let createdProductId = null;
      try{
        prodRes = await fetch(`${API}/stock`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(productPayload) });
        report.tests.push({name:'create product', status: prodRes.status});
        if(prodRes.status === 201){
          const prodData = await prodRes.json().catch(()=>null);
          createdProductId = prodData?.id || prodData?.product?.id || null;
          report.tests.push({name:'created_product_id', id: createdProductId});
        }

        // Create an entry for the created product
        if(createdProductId){
          const entryPayload = { product_id: createdProductId, quantite: 20, user_id: null, motif: 'Seed entry test', date_mouvement: new Date().toISOString() };
          const entryRes = await fetch(`${API}/entries`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(entryPayload) });
          report.tests.push({name:'create entry', status: entryRes.status});
        }

        // Create an exit for the created product
        if(createdProductId){
          const exitPayload = { product_id: createdProductId, quantity: 5, requester_name: 'Test Service', filiere_id: null, pole_id: null, exit_date: new Date().toISOString(), notes: 'Seed exit test', bon_number: null, user_id: adminUserId };
          const exitRes = await fetch(`${API}/exits`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(exitPayload) });
          report.tests.push({name:'create exit', status: exitRes.status});
        }

        // Create a basic inventory session
        if(adminUserId){
          const invPayload = { name: 'API Test Inventory ' + Date.now(), pole_id: null, filiere_id: null, notes: 'Seed inventory test', created_by: adminUserId };
          const invRes = await fetch(`${API}/inventory`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(invPayload) });
          report.tests.push({name:'create inventory', status: invRes.status});
        }
      }catch(e){ report.tests.push({name:'create product', error: e.message}); }

      // 4. Get poles/filieres/categories
      const poles = await fetch(`${API}/poles`);
      const filieres = await fetch(`${API}/filieres`);
      const categories = await fetch(`${API}/categories`);
      report.tests.push({name:'GET /poles', status: poles.status});
      report.tests.push({name:'GET /filieres', status: filieres.status});
      report.tests.push({name:'GET /categories', status: categories.status});

    }catch(err){
      report.tests.push({name:'admin_flow_error', error: err.message});
    }
  }catch(e){
    console.error('Test runner error', e);
    report.error = e.message;
  }
  console.log('Report:', JSON.stringify(report, null, 2));
  process.exit(0);
}

run();
