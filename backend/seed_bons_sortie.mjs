import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function main(){
  try{
    const ures = await pool.query("SELECT id FROM users WHERE status='active' LIMIT 1");
    const userId = ures.rows[0]?.id || null;
    const prodRes = await pool.query('SELECT id FROM products ORDER BY created_at LIMIT 6');
    const prodIds = prodRes.rows.map(r => r.id);
    if(!userId || prodIds.length === 0){
      console.log('No user or products found to seed bons');
      await pool.end();
      process.exit(1);
    }

    const now = new Date().toISOString();
    const bons = [
      { numero: `BSC-${(new Date()).getFullYear()}-00001`, product_id: prodIds[0], quantity: 2, statut: 'emis', demandeur_id: userId, pole_id: null, filiere_id: null, date_emission: now },
      { numero: `BSC-${(new Date()).getFullYear()}-00002`, product_id: prodIds[1], quantity: 5, statut: 'validee', demandeur_id: userId, pole_id: null, filiere_id: null, date_emission: now, validated_at: now, validateur_id: userId },
      { numero: `BSC-${(new Date()).getFullYear()}-00003`, product_id: prodIds[2], quantity: 10, statut: 'livree', demandeur_id: userId, pole_id: null, filiere_id: null, date_emission: now, exit_date: now, validated_at: now, validateur_id: userId },
      { numero: `BSC-${(new Date()).getFullYear()}-00004`, product_id: prodIds[3], quantity: 1, statut: 'rejetee', demandeur_id: userId, pole_id: null, filiere_id: null, date_emission: now, refusal_comment: 'Demande non justifiée' },
      { numero: `BSC-${(new Date()).getFullYear()}-00005`, product_id: prodIds[4], quantity: 3, statut: 'brouillon', demandeur_id: userId, pole_id: null, filiere_id: null, date_emission: now }
    ];

    for(const b of bons){
      const id = uuidv4();
      const cols = ['id','numero','product_id','quantity','statut','demandeur_id','pole_id','filiere_id','date_emission','exit_date','validated_at','validateur_id','refusal_comment'];
      const vals = [id,b.numero,b.product_id,b.quantity,b.statut,b.demandeur_id,b.pole_id,b.filiere_id,b.date_emission,b.exit_date || null,b.validated_at || null,b.validateur_id || null,b.refusal_comment || null];
      await pool.query(`INSERT INTO bons_sortie(${cols.join(',')}) VALUES(${cols.map((c,i)=>`$${i+1}`).join(',')})`, vals);
      console.log('Inserted bon', b.numero);
    }

    await pool.end();
    process.exit(0);
  }catch(e){
    console.error('seed bons failed', e);
    process.exit(1);
  }
}

main();
