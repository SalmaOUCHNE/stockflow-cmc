-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id VARCHAR(50) NOT NULL DEFAULT 'Utilisateur',
  pole_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending','active','rejected')),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (role_id) REFERENCES roles(nom)
);

-- Table des pôles/magasins
CREATE TABLE IF NOT EXISTS poles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  adresse TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50),
  quantite INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entite_cible VARCHAR(100),
  entite_id VARCHAR(255),
  user_id UUID,
  ip_address VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Insérer les rôles par défaut
INSERT INTO roles (nom, description) VALUES
('Admin', 'Administrateur avec accès complet'),
('Responsable Magasin', 'Responsable de magasin avec permissions étendues'),
('Utilisateur', 'Utilisateur standard avec permissions limitées')
ON CONFLICT (nom) DO NOTHING;
-- FILIERES
CREATE TABLE IF NOT EXISTS filieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle VARCHAR(150) NOT NULL,
    pole_id UUID NOT NULL,
    responsable_id UUID NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_filiere_pole
        FOREIGN KEY (pole_id)
        REFERENCES poles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_filiere_responsable
        FOREIGN KEY (responsable_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    parent_category_id INTEGER NULL,
    description TEXT,

    CONSTRAINT fk_parent_category
        FOREIGN KEY (parent_category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER,
    unite_mesure VARCHAR(50) DEFAULT 'unité',
    stock_actuel INTEGER DEFAULT 0 CHECK (stock_actuel >= 0),
    seuil_alerte INTEGER DEFAULT 0,
    photo_url VARCHAR(500),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- BONS DE SORTIE
CREATE TABLE IF NOT EXISTS bons_sortie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(30) UNIQUE NOT NULL,
    date_emission TIMESTAMP DEFAULT NOW(),
    demandeur_id UUID,
    validateur_id UUID,
    pole_id UUID,
    filiere_id UUID,
    statut VARCHAR(30) DEFAULT 'emis',
    pdf_url VARCHAR(500),

    FOREIGN KEY (demandeur_id) REFERENCES users(id),
    FOREIGN KEY (validateur_id) REFERENCES users(id),
    FOREIGN KEY (pole_id) REFERENCES poles(id),
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- REQUESTS
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    quantite_demandee INTEGER NOT NULL CHECK (quantite_demandee > 0),
    demandeur_id UUID NOT NULL,
    pole_id UUID NOT NULL,
    filiere_id UUID,

    statut VARCHAR(20)
    DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','validee','rejetee')),

    motif_rejet TEXT,
    date_demande TIMESTAMP DEFAULT NOW(),
    date_traitement TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (demandeur_id) REFERENCES users(id),
    FOREIGN KEY (pole_id) REFERENCES poles(id),
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- INVENTORIES
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_debut TIMESTAMP DEFAULT NOW(),
    date_fin TIMESTAMP,
    initie_par UUID NOT NULL,

    statut VARCHAR(20)
    DEFAULT 'en_cours'
    CHECK (statut IN ('en_cours','cloture')),

    observations TEXT,

    FOREIGN KEY (initie_par)
    REFERENCES users(id)
);

-- INVENTORY LINES
CREATE TABLE IF NOT EXISTS inventory_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL,
    product_id UUID NOT NULL,
    stock_theorique INTEGER NOT NULL,
    stock_physique INTEGER,

    ecart INTEGER GENERATED ALWAYS AS
    (COALESCE(stock_physique,0) - stock_theorique) STORED,

    motif_ecart TEXT,
    valide BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (inventory_id)
    REFERENCES inventories(id)
    ON DELETE CASCADE,

    FOREIGN KEY (product_id)
    REFERENCES products(id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    lien_action VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- STOCK MOVEMENTS VERSION COMPLETE
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS motif TEXT,
ADD COLUMN IF NOT EXISTS bon_sortie_id UUID,
ADD COLUMN IF NOT EXISTS date_mouvement TIMESTAMP DEFAULT NOW();

ALTER TABLE stock_movements
ADD CONSTRAINT fk_stock_product
FOREIGN KEY (product_id)
REFERENCES products(id);

ALTER TABLE stock_movements
ADD CONSTRAINT fk_stock_bon
FOREIGN KEY (bon_sortie_id)
REFERENCES bons_sortie(id);