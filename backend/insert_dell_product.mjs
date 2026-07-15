import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function main(){
  const client = pool;
  try{
    const reference = 'DELL-LAT-5420';
    const id = uuidv4();
    // get category id
    const cat = await client.query('SELECT id FROM categories WHERE libelle = $1 LIMIT 1', ['ELECTRONIQUE']);
    const catId = cat.rows[0] ? cat.rows[0].id : null;
    const res = await client.query(`INSERT INTO products(id, reference, code_article, sku, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, capacite_max, created_at, date_entree, date_achat, date_expiration, photo_url, prix_unitaire, emplacement, fournisseur, is_archived)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$12,$13,$14,$15,$16,$17,$18,false)
      ON CONFLICT (reference) DO UPDATE SET libelle=EXCLUDED.libelle RETURNING id`, [
      id, reference, 'DL5420', 'DL5420-001', 'Dell Latitude 5420', 'Dell Latitude 5420, Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro.', catId, 'pièce', 12, 2, 50, '2026-04-20', '2026-04-15', null, 'https://images.dell.com/is/image/DellContent//products/latitute-5420.jpg', 14500.00, 'Entrepôt IT - Ray. A1', 'Dell Inc.'
    ]);


    console.log('Upserted Dell product id:', res.rows[0].id);
    // Create initial stock movement
    await client.query("INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, date_mouvement) VALUES($1, (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), 'entree', $2, 'Seed add Dell', NOW())", [res.rows[0].id, 12]);
    await client.end();
    process.exit(0);
  }catch(e){
    console.error('Insert Dell error:', e);
    process.exit(1);
  }
}

main();
