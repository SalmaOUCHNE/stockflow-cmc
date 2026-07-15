import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';
(async()=>{
  const client = pool;
  try{
    const invsRes = await client.query("SELECT id,name,statut,status FROM inventories ORDER BY started_at DESC NULLS LAST LIMIT 10");
    const prodsRes = await client.query('SELECT id, stock_actuel FROM products');
    const inventories = invsRes.rows;
    const products = prodsRes.rows;
    console.log('Inventories to process', inventories.length, 'Products', products.length);
    for(const inv of inventories){
      const lineCount = (await client.query('SELECT COUNT(*)::int as cnt FROM inventory_lines WHERE inventory_id=$1',[inv.id])).rows[0].cnt;
      if(lineCount>0){ console.log('Inventory',inv.title,'already has lines:', lineCount); continue; }
      for(const p of products){
        const theo = p.stock_actuel || 0;
        // random physical count within +-10%
        const delta = Math.floor((Math.random()*0.2 - 0.1) * Math.max(1,theo));
        const phys = Math.max(0,theo + delta);
        const ecart = phys - theo;
        try{
          await client.query(`INSERT INTO inventory_lines(id, inventory_id, product_id, stock_theorique, stock_physique, motif_ecart) VALUES($1,$2,$3,$4,$5,$6)`, [uuidv4(), inv.id, p.id, theo, phys, (phys-theo)===0?'OK':((phys-theo)>0?'Surplus':'Manque')]);
        }catch(e){ console.error('Failed insert line', e); }
      }
    }
    const total = (await client.query('SELECT COUNT(*)::int as cnt FROM inventory_lines')).rows[0].cnt;
    console.log('Total inventory_lines now:', total);
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} 
})();
