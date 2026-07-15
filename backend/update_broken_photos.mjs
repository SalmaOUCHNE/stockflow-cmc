import pool from './config/database.js';

async function main(){
  try{
    const mapping = [
      { reference: 'HP-LJ-PRO-M404dn', photo: '/uploads/test-HP-LJ-PRO-M404dn.png' },
      { reference: 'WERA-7P', photo: '/uploads/test-TEST-API-001-1781482888338.png' },
      { reference: 'KIT-MAINT-TOOLS', photo: '/uploads/test.png' }
    ];
    for(const m of mapping){
      const r = await pool.query('UPDATE products SET photo_url=$1 WHERE reference=$2 RETURNING id, photo_url',[m.photo, m.reference]);
      if(r.rowCount) console.log('Updated', m.reference, '->', m.photo);
      else console.log('Not found', m.reference);
    }
    await pool.end();
    process.exit(0);
  }catch(e){ console.error('update failed', e); process.exit(1);} }

main();
