import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

const products = [
  {
    reference: 'DELL-LAT-5420', sku: 'DL5420-001', code_article: 'DL5420', nom: 'Dell Latitude 5420',
    description: 'Dell Latitude 5420, Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro.',
    category: 'ELECTRONIQUE', pole: 'Gestion & Commerce', filiere: 'Infrastructure Digitale', unite: 'pièce',
    emplacement: 'Entrepôt IT - Ray. A1', fournisseur: 'Dell Inc.', prix_unitaire: 14500.00, stock_actuel: 12, seuil_alerte: 2, capacite_max: 50,
    date_achat: '2026-04-15', date_entree: '2026-04-20', date_expiration: null,
    url_image: 'https://images.dell.com/is/image/DellContent//products/latitute-5420.jpg', statut: 'actif'
  },
  {
    reference: 'HP-LJ-PRO-M404dn', sku: 'HP-M404-001', code_article: 'HP-M404', nom: 'HP LaserJet Pro M404dn',
    description: 'Imprimante monocrome HP LaserJet Pro M404dn, réseau, recto verso, haut débit.',
    category: 'ELECTRONIQUE', pole: 'Digital & Intelligence Artificielle', filiere: 'Infrastructure Digitale', unite: 'pièce',
    emplacement: 'Impression - Ray. B2', fournisseur: 'HP Inc.', prix_unitaire: 3200.00, stock_actuel: 6, seuil_alerte: 1, capacite_max: 20,
    date_achat: '2025-11-10', date_entree: '2025-11-15', date_expiration: null,
    url_image: 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06619618.png', statut: 'actif'
  },
  {
    reference: 'MACBOOK-PRO-M3-14', sku: 'MBP-M3-14-001', code_article: 'MBP14-M3', nom: 'MacBook Pro M3 14"',
    description: 'Apple MacBook Pro 14" M3, 16GB unified memory, 512GB SSD, macOS.',
    category: 'ELECTRONIQUE', pole: 'Digital & Intelligence Artificielle', filiere: 'Développement d\'Applications Python', unite: 'pièce',
    emplacement: 'Stock IT - Ray. A2', fournisseur: 'Apple', prix_unitaire: 27000.00, stock_actuel: 4, seuil_alerte: 1, capacite_max: 10,
    date_achat: '2026-01-05', date_entree: '2026-01-10', date_expiration: null,
    url_image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310', statut: 'actif'
  },
  {
    reference: 'PELTOR-X4', sku: 'PELTOR-X4-001', code_article: 'PELTORX4', nom: 'Casque de protection Peltor X4',
    description: 'Casque Peltor X4, protection auditive haute performance, norme EN352.',
    category: 'EPI', pole: 'Services à la Personne et à la Communauté', filiere: 'Maintenance Industrielle', unite: 'pièce',
    emplacement: 'Stock EPI - Ray. D1', fournisseur: '3M Peltor', prix_unitaire: 220.00, stock_actuel: 50, seuil_alerte: 10, capacite_max: 200,
    date_achat: '2025-08-01', date_entree: '2025-08-05', date_expiration: null,
    url_image: 'https://multimedia.3m.com/mws/media/1234567PeltorX4.jpg', statut: 'actif'
  },
  {
    reference: 'GANTS-NITRILE-100', sku: 'GANTS-NIT-100', code_article: 'GNT100', nom: 'Gants nitrile boîte 100',
    description: 'Boîte de 100 gants nitrile non poudrés, taille M, usage protection sanitaire et maintenance.',
    category: 'EPI', pole: 'Services à la Personne et à la Communauté', filiere: 'Services à la Personne', unite: 'boîte',
    emplacement: 'Stock EPI - Ray. D2', fournisseur: 'SafeGlove SARL', prix_unitaire: 120.00, stock_actuel: 200, seuil_alerte: 30, capacite_max: 1000,
    date_achat: '2025-09-20', date_entree: '2025-09-25', date_expiration: '2027-09-01',
    url_image: 'https://images.unsplash.com/photo-1582719478250-4f9c2b0d5b3c', statut: 'actif'
  },
  {
    reference: 'KIT-MAINT-TOOLS', sku: 'KIT-MNT-001', code_article: 'KITMT01', nom: 'Kit Maintenance Multi-tools',
    description: 'Kit multi-tools pour maintenance (clé, pinces, tournevis) en valise robuste.',
    category: 'OUTILLAGE', pole: 'Industrie', filiere: 'Maintenance Industrielle', unite: 'set',
    emplacement: 'Atelier - Ray. C3', fournisseur: 'ToolMaster', prix_unitaire: 850.00, stock_actuel: 15, seuil_alerte: 3, capacite_max: 100,
    date_achat: '2026-02-10', date_entree: '2026-02-15', date_expiration: null,
    url_image: 'https://cdn.toolmaster.com/images/kit-maintenance.jpg', statut: 'actif'
  },
  {
    reference: 'WERA-7P', sku: 'WERA-7P-001', code_article: 'WERA7P', nom: 'Tournevis Wera Kraftform 7p',
    description: 'Set 7 tournevis Wera Kraftform, ergonomiques, jeu professionnel.',
    category: 'OUTILLAGE', pole: 'Artisanat', filiere: 'Métiers de l\'Artisanat', unite: 'set',
    emplacement: 'Atelier Outils - Ray. C1', supplier: 'Wera Tools', fournisseur: 'Wera Tools', prix_unitaire: 420.00, stock_actuel: 25, seuil_alerte: 5, capacite_max: 200,
    date_achat: '2025-12-01', date_entree: '2025-12-05', date_expiration: null,
    url_image: 'https://www.wera.de/media/wera_kraftform_7p.jpg', statut: 'actif'
  },
  {
    reference: 'PAPIER-A4-80G', sku: 'A4-80-500', code_article: 'PAP-A4-80', nom: 'Papier A4 Premium 80g (rame)',
    description: 'Rame de 500 feuilles A4 80g, haute qualité pour impressions et copies.',
    category: 'CONSOMMABLE', pole: 'Gestion & Commerce', filiere: 'Gestion d\'Entreprise', unite: 'rame',
    emplacement: 'Stock papier - Ray. B1', fournisseur: 'Papeterie Plus', prix_unitaire: 95.00, stock_actuel: 120, seuil_alerte: 20, capacite_max: 1000,
    date_achat: '2026-03-01', date_entree: '2026-03-05', date_expiration: null,
    url_image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f', statut: 'actif'
  },
  {
    reference: 'CART-CANON-PG545', sku: 'CAN-PG545', code_article: 'CARTPG545', nom: 'Cartouche Canon PG-545',
    description: 'Cartouche d\'encre Canon PG-545 noir, compatible, emballage individuel.',
    category: 'CONSOMMABLE', pole: 'Digital & Intelligence Artificielle', filiere: 'Impression', unite: 'pièce',
    emplacement: 'Fourniture - Ray. B3', fournisseur: 'Canon', prix_unitaire: 150.00, stock_actuel: 80, seuil_alerte: 10, capacite_max: 500,
    date_achat: '2026-02-01', date_entree: '2026-02-05', date_expiration: '2028-02-01',
    url_image: 'https://www.canon-europe.com/media/product_image.jpg', statut: 'actif'
  },
  {
    reference: 'CABLE-CAT6-5M', sku: 'CAT6-5M', code_article: 'CABCAT65', nom: 'Câble Réseau Cat6 5m',
    description: 'Câble réseau RJ45 Cat6, 5 mètres, blindé, pour connexions réseau filaires.',
    category: 'LOGISTIQUE', pole: 'Infrastructure Digitale', filiere: 'Réseaux Informatiques', unite: 'pièce',
    emplacement: 'Câbles - Ray. A3', fournisseur: 'NetCable', prix_unitaire: 35.00, stock_actuel: 200, seuil_alerte: 30, capacite_max: 1000,
    date_achat: '2026-05-10', date_entree: '2026-05-12', date_expiration: null,
    url_image: 'https://images.netcable.com/cat6-5m.jpg', statut: 'actif'
  }
];

async function upsertDemoData(){
  const client = pool;
  try{
    // Ensure product table has extended columns required by UI (idempotent alters) - run outside transaction
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS code_article VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC(12,2)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS emplacement VARCHAR(255)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS fournisseur VARCHAR(255)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_entree TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_achat TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_expiration TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS capacite_max INTEGER`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS qr_code VARCHAR(500)`);

    await client.query('BEGIN');
    // Remove existing product-related data to avoid orphaned relations (only if tables exist)
    const checks = ['stock_movements','inventory_lines','inventories','bons','products','audit_logs','product_history'];
    for(const t of checks){
      const r = await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists`, [t]);
      if(r.rows[0] && r.rows[0].exists){
        await client.query(`DELETE FROM ${t}`);
        console.log(`Cleared table ${t}`);
      } else {
        console.log(`Table ${t} not present, skipping`);
      }
    }

    // Ensure product table has extended columns required by UI (idempotent alters)
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS code_article VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC(12,2)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS emplacement VARCHAR(255)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS fournisseur VARCHAR(255)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_entree TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_achat TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_expiration TIMESTAMP`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS capacite_max INTEGER`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(150)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS qr_code VARCHAR(500)`);

    // Insert categories/poles/filieres if missing (idempotent)
    // For simplicity, ensure categories exist
    const categories = ['CONSOMMABLE','ELECTRONIQUE','EPI','OUTILLAGE','LOGISTIQUE'];
    for(const c of categories){
      const ex = await client.query('SELECT 1 FROM categories WHERE libelle = $1 LIMIT 1', [c]);
      if(ex.rows.length === 0) await client.query('INSERT INTO categories(libelle) VALUES($1)', [c]);
    }
    // Ensure poles and filieres minimal entries
    const poles = ['Digital & Intelligence Artificielle','Industrie','Gestion & Commerce','Services à la Personne et à la Communauté','Artisanat'];
    for(const p of poles){
      const ex2 = await client.query('SELECT 1 FROM poles WHERE nom = $1 LIMIT 1', [p]);
      if(ex2.rows.length === 0) await client.query('INSERT INTO poles(nom) VALUES($1)', [p]);
    }
    // add filieres mapping if missing
    const filieres = [
      { lib: 'Infrastructure Digitale', pole: 'Digital & Intelligence Artificielle' },
      { lib: 'Réseaux Informatiques', pole: 'Digital & Intelligence Artificielle' },
      { lib: 'Maintenance Industrielle', pole: 'Industrie' },
      { lib: 'Gestion d\'Entreprise', pole: 'Gestion & Commerce' },
      { lib: 'Métiers de l\'Artisanat', pole: 'Artisanat' }
    ];
    for(const f of filieres){
      const poleRes = await client.query('SELECT id FROM poles WHERE nom = $1 LIMIT 1', [f.pole]);
      const poleId = poleRes.rows[0] ? poleRes.rows[0].id : null;
      const exf = await client.query('SELECT 1 FROM filieres WHERE libelle = $1 LIMIT 1', [f.lib]);
      if(exf.rows.length === 0) await client.query('INSERT INTO filieres(libelle, pole_id) VALUES($1,$2)', [f.lib, poleId]);
    }

    // Insert products
    for(const p of products){
      const categoryIdRes = await client.query('SELECT id FROM categories WHERE libelle = $1 LIMIT 1', [p.category]);
      const catId = categoryIdRes.rows[0] ? categoryIdRes.rows[0].id : null;
      const poleIdRes = await client.query('SELECT id FROM poles WHERE nom = $1 LIMIT 1', [p.pole]);
      const poleId = poleIdRes.rows[0] ? poleIdRes.rows[0].id : null;
      const filIdRes = await client.query('SELECT id FROM filieres WHERE libelle = $1 LIMIT 1', [p.filiere]);
      const filId = filIdRes.rows[0] ? filIdRes.rows[0].id : null;
      const id = uuidv4();
      const resIns = await client.query(`
        INSERT INTO products(id, reference, code_article, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, capacite_max, created_at, date_entree, date_achat, date_expiration, photo_url, prix_unitaire, emplacement, fournisseur, is_archived)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,$14,$15,$16,$17,false)
        ON CONFLICT (reference) DO UPDATE SET
          code_article = EXCLUDED.code_article,
          libelle = EXCLUDED.libelle,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          unite_mesure = EXCLUDED.unite_mesure,
          stock_actuel = EXCLUDED.stock_actuel,
          seuil_alerte = EXCLUDED.seuil_alerte,
          capacite_max = EXCLUDED.capacite_max,
          date_entree = EXCLUDED.date_entree,
          date_achat = EXCLUDED.date_achat,
          date_expiration = EXCLUDED.date_expiration,
          photo_url = EXCLUDED.photo_url,
          prix_unitaire = EXCLUDED.prix_unitaire,
          emplacement = EXCLUDED.emplacement,
          fournisseur = EXCLUDED.fournisseur,
          is_archived = EXCLUDED.is_archived
        RETURNING id
      `, [id, p.reference, p.code_article, p.nom, p.description, catId, p.unite, p.stock_actuel, p.seuil_alerte, p.capacite_max, p.date_entree, p.date_achat, p.date_expiration, p.url_image, p.prix_unitaire, p.emplacement, p.fournisseur]);
      const prodId = resIns.rows[0].id;

      // create initial stock movement (entree) corresponding to stock_actuel
      if(p.stock_actuel && p.stock_actuel > 0){
        await client.query(`INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, date_mouvement) VALUES($1, (SELECT id FROM users WHERE email = 'admin@stockflow.local' LIMIT 1), 'entree', $2, 'Seed initial stock', NOW())`, [prodId, p.stock_actuel]);
      }

      // create an audit log entry
      // audit_logs schema: action, entite_cible, entite_id, user_id, ip_address, details, created_at
      await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW())`, [
        'create.product', 'product', prodId, JSON.stringify({ reference: p.reference, nom: p.nom, stock_actuel: p.stock_actuel })
      ]);

      // generate simple history entries table if exists
      try{
        await client.query(`INSERT INTO product_history(product_id, event_type, note, created_at) VALUES($1,$2,$3,NOW())`, [id, 'created', `Product ${p.nom} created by seed`]);
      }catch(e){ /* ignore if table not present */ }
    }

    // Create audit logs realistic approx 50 entries
    const actions = ['login.user','create.product','update.product','stock.entree','stock.sortie','bon.validate','inventory.create','user.approve'];
    for(let i=0;i<50;i++){
      const act = actions[i % actions.length];
      await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW() - ($5 || ' minutes')::interval)`, [act, 'system', null, JSON.stringify({ note: `Seed audit ${i+1} - ${act}` }), (i*10)]);
    }

    await client.query('COMMIT');
    console.log('Seed replace with 10 products completed');
    process.exit(0);
  }catch(e){
    console.error('Error seeding:', e);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  }
}

upsertDemoData();
