-- Additional demo seed for StockFlow CMC
-- Adds extra columns, movements, inventories, users approvals, notifications, and PDF fields

-- Add columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS code_article VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS date_entree TIMESTAMP;

ALTER TABLE bons_sortie ADD COLUMN IF NOT EXISTS signatures JSONB;
ALTER TABLE bons_sortie ADD COLUMN IF NOT EXISTS beneficiaire VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_demande TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_approbation TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS validateur_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commentaire_rejet TEXT;

-- Populate code_article and date_entree if missing
UPDATE products SET code_article = reference WHERE code_article IS NULL;
UPDATE products SET date_entree = created_at WHERE date_entree IS NULL;

-- Ensure admin exists and get id

-- If no admin, create a default admin
INSERT INTO users (nom, prenom, email, password_hash, role_id, status, is_active, created_at)
SELECT 'Admin','System','admin@stockflow.local','$2b$10$abcdefghijklmnopqrstuv', 'Admin', 'active', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@stockflow.local');

-- Get admin id

-- 20 validated entries: insert movements
INSERT INTO stock_movements (product_id, user_id, type, quantite, motif, date_mouvement)
SELECT p.id, (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), 'entree', v.qty, 'Réception fournisseur (seed)', NOW() - (INTERVAL '1 day' * (v.i+1))
FROM (
  VALUES
    ('SKU-A4-001', 50, 1),
    ('SKU-PEN-BL', 100, 2),
    ('SKU-PEN-RD', 60, 3),
    ('SKU-MARK-01', 40, 4),
    ('SKU-CAH-A4', 80, 5),
    ('SKU-CARTR-HP', 30, 6),
    ('SKU-CLAS-ARC', 20, 7),
    ('SKU-BLOC-NOT', 60, 8),
    ('SKU-LAP-DELL-15', 10, 9),
    ('SKU-LAP-HP-14', 8, 10),
    ('SKU-MON-24', 15, 11),
    ('SKU-KBR-LOG', 25, 12),
    ('SKU-MSE-LOG', 30, 13),
    ('SKU-UPS-APC', 5, 14),
    ('SKU-HELM-01', 30, 15),
    ('SKU-GANT-01', 50, 16),
    ('SKU-GOG-01', 40, 17),
    ('SKU-GILET-01', 35, 18),
    ('SKU-BULB-LED', 100, 19),
    ('SKU-EXT-LEAD', 60, 20)
) AS v(ref, qty, i)
JOIN products p ON p.reference = v.ref
ON CONFLICT DO NOTHING;

-- 15 validated exits
INSERT INTO bons_sortie (numero, date_emission, demandeur_id, pole_id, filiere_id, statut, beneficiaire)
SELECT concat('BS-', to_char(NOW(), 'YYYYMMDDHH24MISS'), '-', (floor(random()*90000)+10000)::int), NOW() - (INTERVAL '1 day' * s.i), (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), null, null, 'validee', concat('Service ', s.i)
FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15)) AS s(i)
ON CONFLICT DO NOTHING;

-- Link exits to products: for last 15 validated bons_inserted, create stock_movements
DO $$
DECLARE
  b RECORD;
  refs TEXT[] := ARRAY['SKU-PEN-BL','SKU-PEN-RD','SKU-DRILL-BOS','SKU-UPS-APC','SKU-BUREAU-01','SKU-KBR-LOG','SKU-MSE-LOG','SKU-CHAIR-ERG','SKU-SHELF-01','SKU-TROLLEY-01','SKU-BULB-LED','SKU-EXT-LEAD','SKU-ARM-01','SKU-CLAS-ARC','SKU-CARTR-HP'];
  qtys INTEGER[] := ARRAY[30,20,5,2,1,10,12,3,4,1,40,20,2,15,8];
  i INT := 1;
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email='admin@stockflow.local' LIMIT 1;
  FOR b IN SELECT id FROM bons_sortie WHERE statut='validee' ORDER BY date_emission DESC LIMIT 15 LOOP
    INSERT INTO stock_movements(product_id, user_id, type, quantite, motif, bon_sortie_id, date_mouvement)
    SELECT p.id, admin_id, 'sortie', qtys[i], 'Sortie validée (seed)', b.id, NOW() - (INTERVAL '1 day' * i)
    FROM products p WHERE p.reference = refs[i];

    UPDATE products SET stock_actuel = GREATEST(0, COALESCE(stock_actuel,0) - qtys[i]) WHERE reference = refs[i];
    i := i + 1;
  END LOOP;
END $$;

-- 10 pending sorties (emis)
INSERT INTO bons_sortie (numero, date_emission, demandeur_id, pole_id, filiere_id, statut, beneficiaire)
SELECT concat('BS-PEND-', to_char(NOW(), 'YYYYMMDDHH24MISS'), '-', s.i), NOW() - (INTERVAL '2 days' * s.i), (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), null, null, 'emis', concat('Service PEND ', s.i)
FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10)) AS s(i)
ON CONFLICT DO NOTHING;

-- 5 refused sorties (statut 'rejetee')
INSERT INTO bons_sortie (numero, date_emission, demandeur_id, pole_id, filiere_id, statut, beneficiaire)
SELECT concat('BS-REF-', to_char(NOW(), 'YYYYMMDDHH24MISS'), '-', s.i), NOW() - (INTERVAL '3 days' * s.i), (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), null, null, 'rejetee', concat('Service REF ', s.i)
FROM (VALUES (1),(2),(3),(4),(5)) AS s(i)
ON CONFLICT DO NOTHING;

-- For refused bons, add an audit notification and don't create stock_movements

-- Create additional inventories up to 10 total
INSERT INTO inventories (date_debut, date_fin, initie_par, statut, observations)
SELECT NOW() - (INTERVAL '15 days' * s.i), CASE WHEN s.i % 2 = 0 THEN NOW() - (INTERVAL '15 days' * (s.i-1)) ELSE NULL END, (SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), CASE WHEN s.i % 2 = 0 THEN 'cloture' ELSE 'en_cours' END, concat('Seed inventory extra ', s.i)
FROM (VALUES (1),(2),(3),(4)) AS s(i)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE observations = concat('Seed inventory extra ', s.i));

-- Insert inventory lines with varied ecarts
DO $$
DECLARE
  inv RECORD;
  p RECORD;
  cnt INT := 0;
BEGIN
  FOR inv IN SELECT id FROM inventories WHERE observations LIKE 'Seed inventory%extra%' LOOP
    cnt := 0;
    FOR p IN SELECT id, stock_actuel FROM products ORDER BY RANDOM() LIMIT 12 LOOP
      cnt := cnt + 1;
      INSERT INTO inventory_lines (inventory_id, product_id, stock_theorique, stock_physique, motif_ecart, valide)
      VALUES (inv.id, p.id, p.stock_actuel, GREATEST(0, p.stock_actuel + ( (random() - 0.6 ) * 10 )::int ), null, (cnt % 3 = 0))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Notifications: low stock alerts and expirations (fake)
INSERT INTO notifications (user_id, type, message, lien_action, created_at)
SELECT u.id, 'low_stock', concat('Alerte: le produit ', p.libelle, ' est en dessous du seuil'), '/stock/' || p.id, NOW()
FROM users u CROSS JOIN LATERAL (
  SELECT * FROM products WHERE stock_actuel <= seuil_alerte LIMIT 5
) p
LIMIT 10;

-- Create test users in various statuses
INSERT INTO users (nom, prenom, email, password_hash, role_id, status, is_active, date_demande, created_at)
SELECT 'User', concat('Test', s.i), concat('user', s.i, '@example.local'), '$2b$10$abcdefghijklmnopqrstuv', 'Utilisateur', 'pending', false, NOW() - (INTERVAL '5 days' * s.i), NOW() - (INTERVAL '5 days' * s.i)
FROM (VALUES (1),(2),(3),(4),(5)) AS s(i)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = concat('user', s.i, '@example.local'));

-- Approve two users
UPDATE users SET status='active', date_approbation=NOW(), validateur_id=(SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), is_active=true WHERE email IN ('user1@example.local','user2@example.local');

-- Reject one user
UPDATE users SET status='rejected', date_approbation=NOW(), validateur_id=(SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1), commentaire_rejet='Informations manquantes', is_active=false WHERE email = 'user3@example.local';

-- Recalculate stock_actuel from movements to ensure consistency
UPDATE products SET stock_actuel = GREATEST(0, COALESCE((SELECT SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END) FROM stock_movements sm WHERE sm.product_id = products.id), 0));

SELECT 'Seed more executed' as info;
