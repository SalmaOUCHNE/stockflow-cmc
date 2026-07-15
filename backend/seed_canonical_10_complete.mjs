import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

const products = [
  {
    reference: 'DELL-LAT-5420', sku: 'DL5420-001', code_article: 'DL5420', name: 'Dell Latitude 5420',
    description: 'Dell Latitude 5420, Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro.',
    category: 'ELECTRONIQUE', pole: 'Digital & Intelligence Artificielle', filiere: 'Infrastructure Digitale', unit: 'pièce',
    emplacement: 'Entrepôt IT - Ray. A1', supplier: 'Dell Inc.', price: 14500.00, stock: 12, min_threshold: 2, max_capacity: 50,
    date_achat: '2026-04-15', date_entree: '2026-04-20', date_expiration: null, image: 'https://i.dell.com/sites/imagecontent/products/PublishingImages/latitude-5420-lp/latitude-5420-lp.jpg'
  },
  {
    reference: 'HP-LJ-PRO-M404dn', sku: 'HP-M404-001', code_article: 'HP-M404', name: 'HP LaserJet Pro M404dn',
    description: 'Imprimante monochrome HP LaserJet Pro M404dn, réseau, recto verso.',
    category: 'ELECTRONIQUE', pole: 'Digital & Intelligence Artificielle', filiere: 'Impression', unit: 'pièce',
    emplacement: 'Impression - Ray. B2', supplier: 'HP Inc.', price: 3200.00, stock: 6, min_threshold: 1, max_capacity: 20,
    date_achat: '2025-11-10', date_entree: '2025-11-15', date_expiration: null, image: 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06619618.png'
  },
  {
    reference: 'MACBOOK-PRO-M3-14', sku: 'MBP-M3-14-001', code_article: 'MBP14-M3', name: 'MacBook Pro M3 14"',
    description: 'Apple MacBook Pro 14" M3, 16GB unified memory, 512GB SSD.',
    category: 'ELECTRONIQUE', pole: 'Digital & Intelligence Artificielle', filiere: 'Développement d\'Applications Python', unit: 'pièce',
    emplacement: 'Stock IT - Ray. A2', supplier: 'Apple', price: 27000.00, stock: 4, min_threshold: 1, max_capacity: 10,
    date_achat: '2026-01-05', date_entree: '2026-01-10', date_expiration: null, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310'
  },
  {
    reference: 'PELTOR-X4', sku: 'PELTOR-X4-001', code_article: 'PELTORX4', name: 'Casque de protection Peltor X4',
    description: 'Casque Peltor X4, protection auditive haute performance, norme EN352.',
    category: 'EPI', pole: 'Services à la Personne et à la Communauté', filiere: 'Maintenance Industrielle', unit: 'pièce',
    emplacement: 'Stock EPI - Ray. D1', supplier: '3M Peltor', price: 220.00, stock: 50, min_threshold: 10, max_capacity: 200,
    date_achat: '2025-08-01', date_entree: '2025-08-05', date_expiration: null, image: 'https://multimedia.3m.com/mws/media/1234567PeltorX4.jpg'
  },
  {
    reference: 'GANTS-NITRILE-100', sku: 'GANTS-NIT-100', code_article: 'GNT100', name: 'Gants nitrile boîte 100',
    description: 'Boîte de 100 gants nitrile non poudrés, taille M.',
    category: 'EPI', pole: 'Services à la Personne et à la Communauté', filiere: 'Services à la Personne', unit: 'boîte',
    emplacement: 'Stock EPI - Ray. D2', supplier: 'SafeGlove SARL', price: 120.00, stock: 200, min_threshold: 30, max_capacity: 1000,
    date_achat: '2025-09-20', date_entree: '2025-09-25', date_expiration: '2027-09-01', image: 'https://images.unsplash.com/photo-1582719478250-4f9c2b0d5b3c'
  },
  {
    reference: 'KIT-MAINT-TOOLS', sku: 'KIT-MNT-001', code_article: 'KITMT01', name: 'Kit Maintenance Multi-tools',
    description: 'Kit multi-tools pour maintenance (clé, pinces, tournevis) en valise robuste.',
    category: 'OUTILLAGE', pole: 'Industrie', filiere: 'Maintenance Industrielle', unit: 'set',
    emplacement: 'Atelier - Ray. C3', supplier: 'ToolMaster', price: 850.00, stock: 15, min_threshold: 3, max_capacity: 100,
    date_achat: '2026-02-10', date_entree: '2026-02-15', date_expiration: null, image: 'https://cdn.toolmaster.com/images/kit-maintenance.jpg'
  },
  {
    reference: 'WERA-7P', sku: 'WERA-7P-001', code_article: 'WERA7P', name: 'Tournevis Wera Kraftform 7p',
    description: 'Set 7 tournevis Wera Kraftform, ergonomiques.',
    category: 'OUTILLAGE', pole: 'Artisanat', filiere: 'Métiers de l\'Artisanat', unit: 'set',
    emplacement: 'Atelier Outils - Ray. C1', supplier: 'Wera Tools', price: 420.00, stock: 25, min_threshold: 5, max_capacity: 200,
    date_achat: '2025-12-01', date_entree: '2025-12-05', date_expiration: null, image: 'https://www.wera.de/media/wera_kraftform_7p.jpg'
  },
  {
    reference: 'PAPIER-A4-80G', sku: 'A4-80-500', code_article: 'PAP-A4-80', name: 'Papier A4 Premium 80g (rame)',
    description: 'Rame de 500 feuilles A4 80g, haute qualité pour impressions.',
    category: 'CONSOMMABLE', pole: 'Gestion & Commerce', filiere: 'Gestion d\'Entreprise', unit: 'rame',
    emplacement: 'Stock papier - Ray. B1', supplier: 'Papeterie Plus', price: 95.00, stock: 120, min_threshold: 20, max_capacity: 1000,
    date_achat: '2026-03-01', date_entree: '2026-03-05', date_expiration: null, image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f'
  },
  {
    reference: 'CART-CANON-PG545', sku: 'CAN-PG545', code_article: 'CARTPG545', name: 'Cartouche Canon PG-545',
    description: "Cartouche d'encre Canon PG-545 noir, compatible.",
    category: 'CONSOMMABLE', pole: 'Digital & Intelligence Artificielle', filiere: 'Impression', unit: 'pièce',
    emplacement: 'Fourniture - Ray. B3', supplier: 'Canon', price: 150.00, stock: 80, min_threshold: 10, max_capacity: 500,
    date_achat: '2026-02-01', date_entree: '2026-02-05', date_expiration: '2028-02-01', image: 'https://www.canon-europe.com/media/product_image.jpg'
  },
  {
    reference: 'CABLE-CAT6-5M', sku: 'CAT6-5M', code_article: 'CABCAT65', name: 'Câble Réseau Cat6 5m',
    description: 'Câble réseau RJ45 Cat6, 5 mètres, blindé.',
    category: 'LOGISTIQUE', pole: 'Infrastructure Digitale', filiere: 'Réseaux Informatiques', unit: 'pièce',
    emplacement: 'Câbles - Ray. A3', supplier: 'NetCable', price: 35.00, stock: 200, min_threshold: 30, max_capacity: 1000,
    date_achat: '2026-05-10', date_entree: '2026-05-12', date_expiration: null, image: 'https://images.netcable.com/cat6-5m.jpg'
  }
];

async function ensureReferenceData(client){
  // categories
  const categories = [...new Set(products.map(p=>p.category))];
  for(const c of categories){
    const r = await client.query('SELECT id FROM categories WHERE libelle = $1 LIMIT 1', [c]);
    if(r.rows.length===0) await client.query('INSERT INTO categories(libelle) VALUES($1)', [c]);
  }
  // poles
  const poles = [...new Set(products.map(p=>p.pole))];
  for(const p of poles){
    const r = await client.query('SELECT id FROM poles WHERE nom = $1 LIMIT 1', [p]);
    if(r.rows.length===0) await client.query('INSERT INTO poles(nom) VALUES($1)', [p]);
  }
  // filieres
  for(const p of products){
    const poleRes = await client.query('SELECT id FROM poles WHERE nom = $1 LIMIT 1', [p.pole]);
    const poleId = poleRes.rows[0] ? poleRes.rows[0].id : null;
    const r = await client.query('SELECT id FROM filieres WHERE libelle = $1 LIMIT 1', [p.filiere]);
    if(r.rows.length===0) await client.query('INSERT INTO filieres(libelle, pole_id) VALUES($1,$2)', [p.filiere, poleId]);
  }
}

async function upsertProducts(){
  const client = pool;
  try{
    await client.query('BEGIN');
    await ensureReferenceData(client);

    // ensure admin user exists
    let adminRes = await client.query("SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1");
    let adminId = adminRes.rows[0] ? adminRes.rows[0].id : null;
    if(!adminId){
      const u = await client.query("INSERT INTO users(full_name, email, password, status, role) VALUES($1,$2,$3,$4,$5) RETURNING id", ['Admin StockFlow','admin@stockflow.local','AdminPass123!','approved','admin']);
      adminId = u.rows[0].id;
    }

    for(const p of products){
      const categoryRes = await client.query('SELECT id FROM categories WHERE libelle = $1 LIMIT 1', [p.category]);
      const catId = categoryRes.rows[0] ? categoryRes.rows[0].id : null;
      const poleRes = await client.query('SELECT id FROM poles WHERE nom = $1 LIMIT 1', [p.pole]);
      const poleId = poleRes.rows[0] ? poleRes.rows[0].id : null;
      const filRes = await client.query('SELECT id FROM filieres WHERE libelle = $1 LIMIT 1', [p.filiere]);
      const filId = filRes.rows[0] ? filRes.rows[0].id : null;

      const id = uuidv4();
      const up = await client.query(`INSERT INTO products(id, reference, code_article, sku, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, capacite_max, date_entree, date_achat, date_expiration, photo_url, prix_unitaire, emplacement, fournisseur, qr_code, created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
        ON CONFLICT (reference) DO UPDATE SET libelle=EXCLUDED.libelle, description=EXCLUDED.description, stock_actuel=EXCLUDED.stock_actuel, photo_url=EXCLUDED.photo_url
        RETURNING id`, [id, p.reference, p.code_article, p.sku, p.name, p.description, catId, p.unit, p.stock, p.min_threshold, p.max_capacity, p.date_entree, p.date_achat, p.date_expiration, p.image, p.price, p.emplacement, p.supplier, `${p.reference}`]);

      const prodId = up.rows[0].id;

      // add few stock movements to create history
      await client.query(`INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, date_mouvement) VALUES($1,$2,$3,$4,$5,NOW() - INTERVAL '30 days')`, [prodId, adminId, 'entree', p.stock, 'Initial seed stock']);
      await client.query(`INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, date_mouvement) VALUES($1,$2,$3,$4,$5,NOW() - INTERVAL '10 days')`, [prodId, adminId, 'sortie', Math.max(1, Math.floor(p.stock * 0.05)), 'Usage seed']);
      await client.query(`INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, date_mouvement) VALUES($1,$2,$3,$4,$5,NOW() - INTERVAL '3 days')`, [prodId, adminId, 'entree', Math.max(1, Math.floor(p.stock * 0.1)), 'Replenishment seed']);

      // audit log
      await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW())`,['create.product','product',prodId, JSON.stringify({reference:p.reference,name:p.name,stock:p.stock})]);

      // product_history
      try{
        await client.query(`INSERT INTO product_history(product_id, event_type, note, created_at) VALUES($1,$2,$3,NOW())`, [prodId, 'seed.created', `Inserted canonical product ${p.reference}`]);
      }catch(e){/* ignore if table missing */}
    }

    // create a simple inventory session for demo
    try{
      const invRes = await client.query(`INSERT INTO inventories(id, title, created_at, status) VALUES($1,$2,NOW(),'open') RETURNING id`, [uuidv4(), 'Inventaire démo T2 2026']);
      const invId = invRes.rows[0].id;
      // add inventory lines for each product
      for(const p of products){
        const r = await client.query('SELECT id, stock_actuel FROM products WHERE reference = $1 LIMIT 1', [p.reference]);
        if(r.rows[0]){
          const prodId = r.rows[0].id;
          const theoretical = r.rows[0].stock_actuel ?? 0;
          await client.query(`INSERT INTO inventory_lines(inventory_id, product_id, quantite_theorique, quantite_physique, justification, created_at) VALUES($1,$2,$3,$4,$5,NOW())`, [invId, prodId, theoretical, theoretical, 'Seed inventory line']);
        }
      }
    }catch(e){/* inventory table may be named differently; ignore */}

    await client.query('COMMIT');
    console.log('Seed canonical 10 completed');
    process.exit(0);
  }catch(e){
    console.error('Seed canonical error', e);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  }
}

upsertProducts();
