-- Idempotent seed for poles, filieres and categories

-- POLES
INSERT INTO poles (nom, description) 
SELECT 'Digital & Intelligence Artificielle', 'Pôle Digital et IA' 
WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Digital & Intelligence Artificielle');

INSERT INTO poles (nom, description) 
SELECT 'Industrie', 'Pôle Industrie' 
WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Industrie');

INSERT INTO poles (nom, description) SELECT 'Gestion & Commerce', 'Pôle Gestion et Commerce' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Gestion & Commerce');
INSERT INTO poles (nom, description) SELECT 'Agriculture', 'Pôle Agriculture' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Agriculture');
INSERT INTO poles (nom, description) SELECT 'Agro-industrie', 'Pôle Agro-industrie' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Agro-industrie');
INSERT INTO poles (nom, description) SELECT 'Tourisme – Hôtellerie – Restauration', 'Pôle Tourisme Hôtellerie Restauration' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration');
INSERT INTO poles (nom, description) SELECT 'Services à la Personne et à la Communauté', 'Pôle Services à la Personne' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Services à la Personne et à la Communauté');
INSERT INTO poles (nom, description) SELECT 'Artisanat', 'Pôle Artisanat' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Artisanat');
INSERT INTO poles (nom, description) SELECT 'Arts & Industrie Graphique', 'Pôle Arts et Industrie Graphique' WHERE NOT EXISTS (SELECT 1 FROM poles WHERE nom = 'Arts & Industrie Graphique');

-- FILIERES (for each pole insert if not exists)
-- Digital & Intelligence Artificielle
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Développement d''Applications Python', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Développement d''Applications Python' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Développement E-Commerce', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Développement E-Commerce' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Informatique Décisionnelle', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Informatique Décisionnelle' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Intelligence Artificielle', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Intelligence Artificielle' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Développement Digital', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Développement Digital' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Infrastructure Digitale', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Infrastructure Digitale' AND p.nom='Digital & Intelligence Artificielle');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Réseaux Informatiques', (SELECT id FROM poles WHERE nom = 'Digital & Intelligence Artificielle')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Réseaux Informatiques' AND p.nom='Digital & Intelligence Artificielle');

-- Industrie
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Génie Mécanique', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Génie Mécanique' AND p.nom='Industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Génie Thermique', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Génie Thermique' AND p.nom='Industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Hydraulique Industrielle', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Hydraulique Industrielle' AND p.nom='Industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Électromécanique des Engins Motorisés', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Électromécanique des Engins Motorisés' AND p.nom='Industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Maintenance Industrielle', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Maintenance Industrielle' AND p.nom='Industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Automatisation Industrielle', (SELECT id FROM poles WHERE nom = 'Industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Automatisation Industrielle' AND p.nom='Industrie');

-- Gestion & Commerce
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Gestion d''Entreprise', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Gestion d''Entreprise' AND p.nom='Gestion & Commerce');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Commerce Digital', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Commerce Digital' AND p.nom='Gestion & Commerce');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Marketing Digital', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Marketing Digital' AND p.nom='Gestion & Commerce');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Comptabilité et Finance', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Comptabilité et Finance' AND p.nom='Gestion & Commerce');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Techniques de Vente', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Techniques de Vente' AND p.nom='Gestion & Commerce');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Gestion Logistique', (SELECT id FROM poles WHERE nom = 'Gestion & Commerce')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Gestion Logistique' AND p.nom='Gestion & Commerce');

-- Agriculture
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Agriculture de Précision', (SELECT id FROM poles WHERE nom = 'Agriculture')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Agriculture de Précision' AND p.nom='Agriculture');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Pompage Solaire', (SELECT id FROM poles WHERE nom = 'Agriculture')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Pompage Solaire' AND p.nom='Agriculture');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Embellissement et Entretien des Espaces Verts', (SELECT id FROM poles WHERE nom = 'Agriculture')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Embellissement et Entretien des Espaces Verts' AND p.nom='Agriculture');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Techniques Agricoles Modernes', (SELECT id FROM poles WHERE nom = 'Agriculture')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Techniques Agricoles Modernes' AND p.nom='Agriculture');

-- Agro-industrie
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Transformation Agroalimentaire', (SELECT id FROM poles WHERE nom = 'Agro-industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Transformation Agroalimentaire' AND p.nom='Agro-industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Contrôle Qualité Agroalimentaire', (SELECT id FROM poles WHERE nom = 'Agro-industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Contrôle Qualité Agroalimentaire' AND p.nom='Agro-industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Production Agroalimentaire', (SELECT id FROM poles WHERE nom = 'Agro-industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Production Agroalimentaire' AND p.nom='Agro-industrie');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Gestion des Unités Agro-industrie', (SELECT id FROM poles WHERE nom = 'Agro-industrie')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Gestion des Unités Agro-industrie' AND p.nom='Agro-industrie');

-- Tourisme – Hôtellerie – Restauration
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Réception Hôtelière', (SELECT id FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Réception Hôtelière' AND p.nom='Tourisme – Hôtellerie – Restauration');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Agent de Restauration', (SELECT id FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Agent de Restauration' AND p.nom='Tourisme – Hôtellerie – Restauration');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Cuisine', (SELECT id FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Cuisine' AND p.nom='Tourisme – Hôtellerie – Restauration');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Housekeeping', (SELECT id FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Housekeeping' AND p.nom='Tourisme – Hôtellerie – Restauration');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Services Hôteliers', (SELECT id FROM poles WHERE nom = 'Tourisme – Hôtellerie – Restauration')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Services Hôteliers' AND p.nom='Tourisme – Hôtellerie – Restauration');

-- Services à la Personne et à la Communauté
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Éducateur Petite Enfance', (SELECT id FROM poles WHERE nom = 'Services à la Personne et à la Communauté')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Éducateur Petite Enfance' AND p.nom='Services à la Personne et à la Communauté');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Assistance Sociale', (SELECT id FROM poles WHERE nom = 'Services à la Personne et à la Communauté')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Assistance Sociale' AND p.nom='Services à la Personne et à la Communauté');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Animation Socio-éducative', (SELECT id FROM poles WHERE nom = 'Services à la Personne et à la Communauté')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Animation Socio-éducative' AND p.nom='Services à la Personne et à la Communauté');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Services à la Personne', (SELECT id FROM poles WHERE nom = 'Services à la Personne et à la Communauté')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Services à la Personne' AND p.nom='Services à la Personne et à la Communauté');

-- Artisanat
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Haute Couture', (SELECT id FROM poles WHERE nom = 'Artisanat')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Haute Couture' AND p.nom='Artisanat');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Métiers de l''Artisanat', (SELECT id FROM poles WHERE nom = 'Artisanat')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Métiers de l''Artisanat' AND p.nom='Artisanat');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Création Textile et Habillement', (SELECT id FROM poles WHERE nom = 'Artisanat')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Création Textile et Habillement' AND p.nom='Artisanat');

-- Arts & Industrie Graphique
INSERT INTO filieres (libelle, pole_id) 
SELECT 'Infographie', (SELECT id FROM poles WHERE nom = 'Arts & Industrie Graphique')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Infographie' AND p.nom='Arts & Industrie Graphique');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Design Graphique', (SELECT id FROM poles WHERE nom = 'Arts & Industrie Graphique')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Design Graphique' AND p.nom='Arts & Industrie Graphique');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Impression Numérique', (SELECT id FROM poles WHERE nom = 'Arts & Industrie Graphique')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Impression Numérique' AND p.nom='Arts & Industrie Graphique');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Communication Visuelle', (SELECT id FROM poles WHERE nom = 'Arts & Industrie Graphique')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Communication Visuelle' AND p.nom='Arts & Industrie Graphique');

INSERT INTO filieres (libelle, pole_id) 
SELECT 'Prépresse et PAO', (SELECT id FROM poles WHERE nom = 'Arts & Industrie Graphique')
WHERE NOT EXISTS (SELECT 1 FROM filieres f JOIN poles p ON f.pole_id = p.id WHERE f.libelle='Prépresse et PAO' AND p.nom='Arts & Industrie Graphique');

-- CATEGORIES
INSERT INTO categories (libelle, description) SELECT 'CONSOMMABLE', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='CONSOMMABLE');
INSERT INTO categories (libelle, description) SELECT 'ELECTRONIQUE', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='ELECTRONIQUE');
INSERT INTO categories (libelle, description) SELECT 'EPI', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='EPI');
INSERT INTO categories (libelle, description) SELECT 'LOGISTIQUE', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='LOGISTIQUE');
INSERT INTO categories (libelle, description) SELECT 'MOBILIER', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='MOBILIER');
INSERT INTO categories (libelle, description) SELECT 'OUTILLAGE', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='OUTILLAGE');
INSERT INTO categories (libelle, description) SELECT 'MAINTENANCE', NULL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE libelle='MAINTENANCE');
