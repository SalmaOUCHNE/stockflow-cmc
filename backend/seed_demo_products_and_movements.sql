-- Demo seed: 30 products + movements, bons, inventories
-- Idempotent: uses ON CONFLICT DO NOTHING and checks

-- Ensure optional columns exist for demo (prix_unitaire, emplacement, fournisseur)
ALTER TABLE products ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS emplacement VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fournisseur VARCHAR(255);

-- Ensure an admin user exists for demo actions
INSERT INTO users (id, nom, prenom, email, password_hash, role_id, status, is_active)
SELECT gen_random_uuid(), 'Admin', 'System', 'admin@stockflow.local', 'demo', 'Admin', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@stockflow.local')
RETURNING id;

-- get admin id into a variable-like selection later

-- PRODUCTS list: reference must be unique

-- CONSOMMABLES (8)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-A4-001', 'Ramette papier A4', 'Ramette papier A4 80g - 500 feuilles', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'ramette', 200, 10, 'https://picsum.photos/seed/paper/600/400', 45.00, 'Stock central - Rayon A1', 'Office Supplies SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-A4-001');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-PEN-BL', 'Stylo bleu', 'Stylo bille encre bleue paquet 10', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'paquet', 500, 50, 'https://picsum.photos/seed/pen-blue/600/400', 12.00, 'Stock central - Rayon A2', 'Papeterie Plus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-PEN-BL');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-PEN-RD', 'Stylo rouge', 'Stylo bille encre rouge paquet 10', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'paquet', 300, 30, 'https://picsum.photos/seed/pen-red/600/400', 12.00, 'Stock central - Rayon A2', 'Papeterie Plus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-PEN-RD');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-MARK-01', 'Marqueur permanent', 'Lot de 5 marqueurs permanents', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'lot', 150, 15, 'https://picsum.photos/seed/marker/600/400', 28.00, 'Stock central - Rayon A3', 'Markers Co', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-MARK-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-CAH-A4', 'Cahier A4', 'Cahier A4 96 pages lignées', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'pièce', 250, 20, 'https://picsum.photos/seed/notebook/600/400', 8.50, 'Stock central - Rayon A1', 'Papeterie Plus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-CAH-A4');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-CARTR-HP', 'Cartouche HP', 'Cartouche HP compatible 85A noir', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'pièce', 80, 5, 'https://picsum.photos/seed/cartridge/600/400', 220.00, 'Stock consommables - A4', 'Imprimo SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-CARTR-HP');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-CLAS-ARC', 'Classeur archivage', 'Classeur A4 - classeur 4 anneaux', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'pièce', 120, 10, 'https://picsum.photos/seed/binder/600/400', 35.00, 'Stock central - Rayon B1', 'Office Supplies SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-CLAS-ARC');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-BLOC-NOT', 'Bloc notes', 'Bloc-notes A5 autocollant 3 unités', (SELECT id FROM categories WHERE libelle='CONSOMMABLE'), 'lot', 180, 15, 'https://picsum.photos/seed/notepad/600/400', 15.00, 'Stock central - Rayon B2', 'Papeterie Plus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-BLOC-NOT');

-- INFORMATIQUE / ELECTRONIQUE (6)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-LAP-DELL-15', 'PC Portable Dell', 'Dell Latitude 15" - i5, 8GB, 256GB SSD', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 40, 5, 'https://picsum.photos/seed/dell/600/400', 6200.00, 'Entrepôt IT - Ray. C1', 'Dell Distribution', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-LAP-DELL-15');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-LAP-HP-14', 'PC Portable HP', 'HP ProBook 14" - i5, 8GB, 256GB SSD', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 30, 5, 'https://picsum.photos/seed/hp/600/400', 5900.00, 'Entrepôt IT - Ray. C1', 'HP Maroc', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-LAP-HP-14');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-MON-24', 'Écran 24 pouces', 'Écran 24" Full HD - HDMI', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 70, 10, 'https://picsum.photos/seed/monitor/600/400', 1200.00, 'Entrepôt IT - Ray. C2', 'ScreensCo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-MON-24');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-KBR-LOG', 'Clavier Logitech', 'Clavier Logitech K120 filaire', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 160, 20, 'https://picsum.photos/seed/keyboard/600/400', 150.00, 'Entrepôt IT - Ray. C3', 'LogiPro', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-KBR-LOG');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-MSE-LOG', 'Souris Logitech', 'Souris optique Logitech', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 200, 25, 'https://picsum.photos/seed/mouse/600/400', 80.00, 'Entrepôt IT - Ray. C3', 'LogiPro', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-MSE-LOG');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-UPS-APC', 'Onduleur APC', 'Onduleur APC 1000VA', (SELECT id FROM categories WHERE libelle='ELECTRONIQUE'), 'pièce', 25, 3, 'https://picsum.photos/seed/apc/600/400', 2200.00, 'Entrepôt IT - Ray. C4', 'APC Distributor', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-UPS-APC');

-- EPI (4)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-HELM-01', 'Casque de sécurité', 'Casque de sécurité norme EN397', (SELECT id FROM categories WHERE libelle='EPI'), 'pièce', 120, 10, 'https://picsum.photos/seed/helmet/600/400', 85.00, 'Stock EPI - Ray. D1', 'SafetyEquip SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-HELM-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-GANT-01', 'Gants de protection', 'Gants de manutention - paire', (SELECT id FROM categories WHERE libelle='EPI'), 'paire', 300, 30, 'https://picsum.photos/seed/gloves/600/400', 25.00, 'Stock EPI - Ray. D2', 'SafetyEquip SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-GANT-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-GOG-01', 'Lunettes de sécurité', 'Lunettes anti-projections', (SELECT id FROM categories WHERE libelle='EPI'), 'pièce', 180, 20, 'https://picsum.photos/seed/goggles/600/400', 40.00, 'Stock EPI - Ray. D2', 'SafetyEquip SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-GOG-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-GILET-01', 'Gilet haute visibilité', 'Gilet jaune haute visibilité taille unique', (SELECT id FROM categories WHERE libelle='EPI'), 'pièce', 140, 15, 'https://picsum.photos/seed/vest/600/400', 32.00, 'Stock EPI - Ray. D3', 'SafetyEquip SARL', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-GILET-01');

-- MOBILIER (4)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-BUREAU-01', 'Bureau administratif', 'Bureau en bois 160x80cm', (SELECT id FROM categories WHERE libelle='MOBILIER'), 'pièce', 15, 2, 'https://picsum.photos/seed/desk/600/400', 1450.00, 'Entrepôt Meubles - Ray. E1', 'OfficeFurn', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-BUREAU-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-CHAIR-ERG', 'Chaise ergonomique', 'Chaise de bureau ergonomique réglable', (SELECT id FROM categories WHERE libelle='MOBILIER'), 'pièce', 60, 6, 'https://picsum.photos/seed/chair/600/400', 850.00, 'Entrepôt Meubles - Ray. E2', 'ComfortSeats', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-CHAIR-ERG');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-ARM-01', 'Armoire métallique', 'Armoire métallique 2 portes', (SELECT id FROM categories WHERE libelle='MOBILIER'), 'pièce', 20, 2, 'https://picsum.photos/seed/wardrobe/600/400', 2200.00, 'Entrepôt Meubles - Ray. E3', 'StoragePro', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-ARM-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-SHELF-01', 'Étagère de stockage', 'Étagère métallique 180x90cm', (SELECT id FROM categories WHERE libelle='MOBILIER'), 'pièce', 35, 4, 'https://picsum.photos/seed/shelf/600/400', 650.00, 'Entrepôt Meubles - Ray. E4', 'StoragePro', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-SHELF-01');

-- OUTILLAGE (4)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-DRILL-BOS', 'Perceuse Bosch', 'Perceuse filaire Bosch 710W', (SELECT id FROM categories WHERE libelle='OUTILLAGE'), 'pièce', 45, 5, 'https://picsum.photos/seed/drill/600/400', 980.00, 'Atelier - Ray. F1', 'Bosch Maroc', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-DRILL-BOS');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-SCREW-SET', 'Tournevis professionnel', 'Set tournevis professionnel 6 pièces', (SELECT id FROM categories WHERE libelle='OUTILLAGE'), 'set', 120, 10, 'https://picsum.photos/seed/screwdriver/600/400', 140.00, 'Atelier - Ray. F2', 'ToolCraft', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-SCREW-SET');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-HAMMER-01', 'Marteau', 'Marteau 16oz manche fibre', (SELECT id FROM categories WHERE libelle='OUTILLAGE'), 'pièce', 150, 15, 'https://picsum.photos/seed/hammer/600/400', 60.00, 'Atelier - Ray. F2', 'ToolCraft', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-HAMMER-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-WRENCH-01', 'Clé à molette', 'Clé à molette 250mm', (SELECT id FROM categories WHERE libelle='OUTILLAGE'), 'pièce', 140, 12, 'https://picsum.photos/seed/wrench/600/400', 75.00, 'Atelier - Ray. F3', 'ToolCraft', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-WRENCH-01');

-- MAINTENANCE / LOGISTIQUE (4)
INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-BULB-LED', 'Ampoule LED', 'Ampoule LED 9W', (SELECT id FROM categories WHERE libelle='MAINTENANCE'), 'pièce', 400, 40, 'https://picsum.photos/seed/bulb/600/400', 18.00, 'Stock Maintenance - Ray. G1', 'ElectroSupply', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-BULB-LED');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-EXT-LEAD', 'Rallonge électrique', 'Rallonge 10m avec terre', (SELECT id FROM categories WHERE libelle='MAINTENANCE'), 'pièce', 200, 20, 'https://picsum.photos/seed/extension/600/400', 120.00, 'Stock Maintenance - Ray. G2', 'ElectroSupply', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-EXT-LEAD');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-TROLLEY-01', 'Chariot de manutention', 'Chariot manutention 2 étages 300kg', (SELECT id FROM categories WHERE libelle='LOGISTIQUE'), 'pièce', 12, 2, 'https://picsum.photos/seed/trolley/600/400', 3200.00, 'Zone Logistique - Ray. H1', 'LogisticsPro', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-TROLLEY-01');

INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, prix_unitaire, emplacement, fournisseur, created_at)
SELECT 'SKU-LADDER-AL', 'Escabeau aluminium', 'Escabeau aluminium 3 marches', (SELECT id FROM categories WHERE libelle='MAINTENANCE'), 'pièce', 30, 3, 'https://picsum.photos/seed/ladder/600/400', 420.00, 'Stock Maintenance - Ray. G3', 'Tools4U', NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE reference='SKU-LADDER-AL');

-- Create 5 validated entries (entree) to simulate incoming stock (these will increase stock_actuel further)
-- Use admin user as user_id
WITH admin AS (SELECT id AS user_id FROM users WHERE email='admin@stockflow.local' LIMIT 1)
INSERT INTO stock_movements (product_id, user_id, type, quantite, motif, date_mouvement)
SELECT p.id, admin.user_id, 'entree', v.qty, 'Reception fournisseur', NOW() - (INTERVAL '10 days' * random())
FROM admin, (
  VALUES
    ('SKU-A4-001', 100),
    ('SKU-LAP-DELL-15', 20),
    ('SKU-MON-24', 30),
    ('SKU-MSE-LOG', 50),
    ('SKU-BULB-LED', 200)
) AS v(ref, qty)
JOIN products p ON p.reference = v.ref
ON CONFLICT DO NOTHING;

-- Apply the entries to products.stock_actuel (add quantities if movements not already reflected)
-- For idempotency, only add movement quantities once by checking a marker: we'll update products by summing stock_movements of type 'entree' and subtracting 'sortie' (recalculate)

UPDATE products
SET stock_actuel = COALESCE( (
  SELECT COALESCE(SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END),0)
  FROM stock_movements sm WHERE sm.product_id = products.id
) + COALESCE((SELECT 0),0), stock_actuel)
WHERE TRUE;

-- Create 5 validated sortie bons (and stock_movements) for various products
WITH admin AS (SELECT id AS user_id FROM users WHERE email='admin@stockflow.local' LIMIT 1)
INSERT INTO bons_sortie (id, numero, date_emission, demandeur_id, pole_id, filiere_id, statut)
SELECT gen_random_uuid(), concat('BS-', to_char(NOW(), 'YYYYMMDDHH24MISS'), '-', (floor(random()*9000)+1000)::int), NOW() - (INTERVAL '5 days' * s.idx), admin.user_id, null, null, 'validee'
FROM admin, (VALUES (1),(2),(3),(4),(5)) AS s(idx)
ON CONFLICT DO NOTHING;

-- For simplicity, insert matching stock_movements for some products tied to bons_sortie.
-- We'll pick recent validated bons and link movements to reduce stock.

DO $$
DECLARE
  b RECORD;
  refs TEXT[] := ARRAY['SKU-PEN-BL','SKU-PEN-RD','SKU-DRILL-BOS','SKU-UPS-APC','SKU-BUREAU-01'];
  qtys INTEGER[] := ARRAY[50,30,10,5,2];
  i INT := 1;
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email='admin@stockflow.local' LIMIT 1;
  FOR b IN SELECT id FROM bons_sortie WHERE statut='validee' ORDER BY date_emission DESC LIMIT 5 LOOP
    INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, bon_sortie_id, date_mouvement)
    SELECT p.id, admin_id, 'sortie', qtys[i], 'Sortie validée', b.id, NOW() - (INTERVAL '1 day' * i)
    FROM products p WHERE p.reference = refs[i];

    UPDATE products SET stock_actuel = GREATEST(0, COALESCE(stock_actuel,0) - qtys[i]) WHERE reference = refs[i];
    i := i + 1;
  END LOOP;
END $$;

-- Create 3 pending sorties (emis) without movements (stock not decreased)
INSERT INTO bons_sortie (numero, date_emission, demandeur_id, pole_id, filiere_id, statut)
SELECT concat('BS-PENDING-', seq), NOW(), u.id, null, null, 'emis'
FROM (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1) u,
LATERAL (VALUES (1),(2),(3)) AS t(seq)
ON CONFLICT DO NOTHING;

-- Create 6 inventory sessions with some inventory_lines (some closed)
WITH admin AS (SELECT id AS user_id FROM users WHERE email='admin@stockflow.local' LIMIT 1)
INSERT INTO inventories (id, date_debut, date_fin, initie_par, statut, observations)
SELECT gen_random_uuid(), NOW() - (INTERVAL '30 days' * s.idx), CASE WHEN s.idx % 2 = 0 THEN NOW() - (INTERVAL '30 days' * (s.idx-1)) ELSE NULL END, admin.user_id, CASE WHEN s.idx % 2 = 0 THEN 'cloture' ELSE 'en_cours' END, concat('Seed inventory ', s.idx)
FROM admin, (VALUES (1),(2),(3),(4),(5),(6)) AS s(idx)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE observations = concat('Seed inventory ', s.idx))
;

-- Insert inventory lines for each created inventory referencing random products
DO $$
DECLARE
  inv RECORD;
  p RECORD;
BEGIN
  FOR inv IN SELECT id FROM inventories WHERE observations LIKE 'Seed inventory %' LOOP
    FOR p IN SELECT id, stock_actuel FROM products ORDER BY RANDOM() LIMIT 10 LOOP
      INSERT INTO inventory_lines (inventory_id, product_id, stock_theorique, stock_physique, motif_ecart, valide)
      VALUES (inv.id, p.id, p.stock_actuel, GREATEST(0, p.stock_actuel + ( (random() - 0.5 ) * 5 )::int ), null, false)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Done
SELECT 'Demo seed executed' as info;
