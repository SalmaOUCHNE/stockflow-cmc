import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function main(){
  try{
    const products = await pool.query('SELECT id, reference, date_achat, date_entree FROM products');
    for(const p of products.rows){
      const qr = `https://stockflow.local/product/${p.id}`;
      const updates = [];
      const params = [];
      // set qr_code if null
      updates.push('qr_code=$1'); params.push(qr);
      // for paper set expiration 365d from date_achat or date_entree if exists
      let expiration = null;
      if(p.reference && p.reference.includes('PAPIER')){
        const base = p.date_achat || p.date_entree || new Date().toISOString();
        const d = new Date(base);
        d.setDate(d.getDate()+365);
        expiration = d.toISOString().split('T')[0];
        updates.push('date_expiration=$2'); params.push(expiration);
      }
      const sql = `UPDATE products SET ${updates.join(', ')} WHERE id=$${params.length+1}`;
      params.push(p.id);
      await pool.query(sql, params);
      console.log('Patched', p.reference, 'qr ->', qr, expiration?('exp -> '+expiration):'');
    }
    await pool.end();
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} }

main();
