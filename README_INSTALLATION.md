# Manuel d'installation et d'utilisation – StockFlow CMC

**Version:** 1.0  
**Date:** Janvier 2025  
**Plateforme:** Windows 10/11  

---

## 1. Présentation du projet

### Description de StockFlow CMC

StockFlow CMC est une application de gestion d'inventaire complète conçue pour la **Chambre des Métiers et de l'Artisanat du Casablanca-Settat**. Elle permet une gestion centralisée des stocks de produits, des entrées, des sorties, avec un système de rapports, d'approbation des utilisateurs, et de notifications en temps réel.

### Objectifs

- Centraliser la gestion des stocks de produits
- Automatiser la création de "Bons d'entrée" et "Bons de sortie"
- Générer des rapports et statistiques en temps réel
- Contrôler l'accès par rôle (Admin, Responsable, Utilisateur)
- Valider les demandes de produits via un système d'approbation
- Notifier les administrateurs des nouvelles inscriptions et demandes
- Permettre l'export en PDF et CSV

### Fonctionnalités principales

? **Gestion d'articles** - Créer, modifier, supprimer des articles avec images  
? **Gestion des stocks** - Suivi en temps réel avec entrées/sorties  
? **Système d'approbation** - Validation des utilisateurs par admin avant accès  
? **Notifications** - Alertes pour admins et utilisateurs  
? **Rapports** - Statistiques par Pôle, Filière, avec exports PDF/CSV  
? **Code QR** - Génération et scan de codes QR pour articles  
? **Utilisateurs** - Gestion des rôles et permissions  
? **Audit** - Journal complet des modifications  

---

## 2. Prérequis

Avant de commencer, assurez-vous que votre ordinateur Windows dispose des éléments suivants :

### 2.1 Système d'exploitation

**Windows 10 ou Windows 11**

- **Vérification:** Appuyez sur `Win + Pause/Attn` ou allez dans **Paramètres > Système > À propos**
- Votre version doit être **1909 ou ultérieure**

### 2.2 Node.js (v16.x ou supérieur)

**Description:** Runtime JavaScript nécessaire pour exécuter l'application

**Téléchargement:**
- Rendez-vous sur https://nodejs.org/
- Téléchargez la version **LTS (Long Term Support)** - version 18.x ou 20.x recommandée

**Installation détaillée:**
1. Double-cliquez sur le fichier `.msi` téléchargé
2. Cliquez sur **Next** à l'écran d'accueil
3. Acceptez les conditions d'utilisation
4. Choisissez le dossier d'installation (laissez par défaut `C:\Program Files\nodejs`)
5. Cochez **"Add to PATH"** (important!)
6. Cliquez sur **Install**
7. Attendez la fin de l'installation
8. Cliquez sur **Finish**

**Vérification de l'installation:**
```powershell
node --version
npm --version
```

Vous devriez voir quelque chose comme :
```
v20.10.0
9.2.0
```

### 2.3 PostgreSQL (v12 ou supérieur)

**Description:** Base de données relationnelle pour stocker les données de l'application

**Téléchargement:**
- Rendez-vous sur https://www.postgresql.org/download/windows/
- Téléchargez l'installateur Windows (version 14.x ou 15.x)

**Installation détaillée:**
1. Double-cliquez sur le fichier PostgreSQL
2. Cliquez sur **Next**
3. Conservez le dossier par défaut `C:\Program Files\PostgreSQL\15`
4. Cliquez sur **Next**
5. À l'écran "Password", entrez un mot de passe sécurisé pour l'utilisateur `postgres` (ex: `SecurePassword2025`)
6. Conservez le port par défaut **5432**
7. Cliquez sur **Next**
8. Choisissez la locale (laissez par défaut)
9. Cliquez sur **Next**, puis **Install**
10. Attendez la fin de l'installation (cela peut prendre quelques minutes)
11. À la fin, décochez "Stack Builder" et cliquez sur **Finish**

**Vérification de l'installation:**
Ouvrez PowerShell et tapez :
```powershell
psql --version
```

Vous devriez voir :
```
psql (PostgreSQL) 15.x
```

### 2.4 Git

**Description:** Système de contrôle de version pour cloner le projet

**Téléchargement:**
- Rendez-vous sur https://git-scm.com/download/win
- Téléchargez l'installateur Windows

**Installation détaillée:**
1. Double-cliquez sur le fichier téléchargé
2. Cliquez sur **Next**
3. Conservez le dossier par défaut
4. Acceptez les options par défaut (incluez Git dans PATH)
5. Cliquez sur **Install**
6. Cliquez sur **Finish**

**Vérification de l'installation:**
```powershell
git --version
```

### 2.5 Visual Studio Code (optionnel mais recommandé)

**Description:** Éditeur de code professionnel

**Téléchargement:** https://code.visualstudio.com/Download

**Installation:** Exécutez l'installateur et suivez les étapes par défaut

---

## 3. Structure du projet

```
casablanca-stock-flow/
¦
+-- frontend/                    # Application React (interface utilisateur)
¦   +-- src/
¦   ¦   +-- pages/              # Pages principales (Accueil, Produits, Stocks, etc.)
¦   ¦   +-- components/         # Composants réutilisables
¦   ¦   +-- services/           # Appels API et logique métier
¦   ¦   +-- hooks/              # Hooks React personnalisés
¦   ¦   +-- App.tsx             # Fichier principal
¦   +-- package.json            # Dépendances frontend
¦   +-- vite.config.ts          # Configuration Vite
¦
+-- backend/                     # Serveur Node.js + Express
¦   +-- controllers/            # Logique métier des endpoints API
¦   +-- routes/                 # Définition des routes API
¦   +-- services/               # Services (auth, notifications, etc.)
¦   +-- models/                 # Modèles de données
¦   +-- middlewares/            # Middlewares Express (authentification, etc.)
¦   +-- config/                 # Configuration (DB, JWT, etc.)
¦   +-- scripts/                # Scripts utilitaires
¦   +-- package.json            # Dépendances backend
¦   +-- server.js               # Fichier principal du serveur
¦
+-- docs/                        # Documentation supplémentaire
+-- .env                         # Variables d'environnement
+-- .gitignore                   # Fichiers ignorés par Git
+-- README_INSTALLATION.md       # Ce fichier
```

### Fichiers importants

- **backend/.env** - Configuration base de données et JWT
- **frontend/.env.local** - Configuration URL API
- **backend/services/auth.service.js** - Authentification et gestion des utilisateurs
- **backend/controllers/products.controller.js** - Gestion des produits
- **backend/routes/api.routes.js** - Définition de toutes les routes API

---

## 4. Installation du projet

### 4.1 Cloner le projet

Ouvrez PowerShell dans le dossier où vous souhaitez installer le projet, puis exécutez :

```powershell
git clone https://github.com/Salma-OUCHNE/casablanca-stock-flow.git
cd casablanca-stock-flow
```

### 4.2 Installer les dépendances Frontend

```powershell
cd frontend
npm install
cd ..
```

Cette commande :
- Lit le fichier `package.json`
- Télécharge toutes les dépendances React et outils
- Crée un dossier `node_modules/`

**Durée attendue:** 2-3 minutes

### 4.3 Installer les dépendances Backend

```powershell
cd backend
npm install
cd ..
```

**Durée attendue:** 2-3 minutes

---

## 5. Configuration PostgreSQL

### 5.1 Créer la base de données

Ouvrez PowerShell et connectez-vous à PostgreSQL :

```powershell
psql -U postgres
```

Entrez le mot de passe que vous avez configuré lors de l'installation.

À l'invite PostgreSQL (`postgres=#`), exécutez :

```sql
CREATE DATABASE stockflow_cmc;
```

Puis quittez :
```sql
\q
```

### 5.2 Vérifier la création

```powershell
psql -U postgres -d stockflow_cmc -c "SELECT 1;"
```

Vous devriez voir :
```
 ?column?
----------
        1
(1 row)
```

---

## 6. Configuration des variables d'environnement

### 6.1 Configuration Backend (.env)

Créez ou modifiez le fichier `backend/.env` :

```bash
# Serveur
PORT=5000
NODE_ENV=development

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockflow_cmc
DB_USER=postgres
DB_PASSWORD=SecurePassword2025

# Authentification JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars_long

# Stockage des images
UPLOAD_DIR=uploads/products

# Environnement
API_URL=http://localhost:5000
```

**Explications:**
- `PORT` - Port sur lequel le serveur s'exécute (5000)
- `DB_HOST` - Adresse du serveur PostgreSQL (localhost = votre machine)
- `DB_NAME` - Nom de la base de données créée (`stockflow_cmc`)
- `DB_USER` - Utilisateur PostgreSQL (`postgres`)
- `DB_PASSWORD` - Mot de passe PostgreSQL (celui que vous avez entré)
- `JWT_SECRET` - Clé secrète pour signer les tokens JWT (changez cette valeur!)

### 6.2 Configuration Frontend (.env.local)

Créez le fichier `frontend/.env.local` :

```bash
VITE_API_URL=http://localhost:5000
```

**Explication:**
- `VITE_API_URL` - URL du backend (le frontend l'utilise pour les appels API)

---

## 7. Initialisation de la base de données

### 7.1 Créer les tables

Le projet inclut un script d'initialisation. Exécutez-le depuis le répertoire backend :

```powershell
cd backend
npm run migrate
cd ..
```

Ce script crée automatiquement:
- Table `users` - Utilisateurs et authentification
- Table `products` - Articles gérés
- Table `stock` - Mouvements de stock
- Table `stock_entries` - Entrées de stock
- Table `stock_outputs` - Sorties de stock
- Table `notifications` - Notifications utilisateurs
- Et autres tables support

### 7.2 Importer les données initiales (optionnel)

Pour charger des données de démonstration :

```powershell
cd backend
node scripts/seed.js
cd ..
```

---

## 8. Lancement de l'application

### 8.1 Démarrer le Backend

Dans un terminal PowerShell, allez dans le dossier backend :

```powershell
cd backend
npm run dev
```

Vous devriez voir :
```
Server is running on http://localhost:5000
Database connected successfully
```

**Ne fermez pas ce terminal** - le serveur doit rester actif.

### 8.2 Démarrer le Frontend (dans un NOUVEAU terminal)

Ouvrez un **nouveau** PowerShell et exécutez :

```powershell
cd frontend
npm run dev
```

Vous devriez voir :
```
VITE v4.x.x  ready in xxx ms

?  Local:   http://localhost:5173/
```

Le frontend démarre sur le port **5173** par défaut.

### 8.3 Accéder à l'application

Ouvrez votre navigateur (Chrome, Edge, Firefox) et allez sur :

```
http://localhost:5173
```

---

## 9. Vérification du bon fonctionnement

### 9.1 Vérifier le Frontend

- [ ] Page de connexion s'affiche
- [ ] Design et images se chargent correctement
- [ ] Pas d'erreurs dans la console du navigateur (F12)

### 9.2 Vérifier le Backend

- [ ] Serveur affiche "Server is running on http://localhost:5000"
- [ ] Base de données connectée ("Database connected successfully")
- [ ] Pas d'erreurs dans le terminal

### 9.3 Vérifier la Base de Données

```powershell
psql -U postgres -d stockflow_cmc -c "SELECT * FROM users LIMIT 1;"
```

Si des utilisateurs existent, vous verrez les colonnes.

### 9.4 Vérifier les API

Utilisez PowerShell pour tester une API :

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```

Vous devriez voir une réponse `{status: "ok"}` (ou similaire).

---

## 10. Comptes de démonstration

### Administrateur

**Email:** `admin@example.com`  
**Mot de passe:** `Admin@123`  
**Rôle:** Administrateur  

L'administrateur peut :
- Approuver/refuser les utilisateurs
- Gérer tous les articles
- Consulter tous les rapports
- Valider les demandes de produits

### Utilisateur Standard

**Email:** `user@example.com`  
**Mot de passe:** `User@123`  
**Rôle:** Utilisateur  

L'utilisateur standard peut :
- Consulter l'inventaire
- Faire des demandes de produits
- Consulter ses notifications

**Création d'un nouvel utilisateur:**

Lors de la première connexion, tous les nouveaux utilisateurs doivent être approuvés par un administrateur. Après inscription, le statut est **"En attente d'approbation"**.

---

## 11. Manuel d'utilisation

### 11.1 Connexion

1. Allez sur http://localhost:5173
2. Entrez votre email et mot de passe
3. Cliquez sur **Se connecter**
4. Si le compte est en attente d'approbation, vous verrez : "Votre compte est en attente de validation par l'administrateur"

### 11.2 Tableau de bord

Après connexion, vous accédez au tableau de bord avec :
- **Résumé du stock** - Nombre total d'articles
- **Derniers mouvements** - Dernières entrées/sorties
- **Notifications** - Alertes en temps réel
- **Menu latéral** - Navigation entre les sections

### 11.3 Gestion des articles

#### Créer un article
1. Allez dans **Articles** du menu latéral
2. Cliquez sur **+ Nouvel article**
3. Remplissez :
   - Nom de l'article
   - Description
   - Sélectionnez une image (JPG, PNG, WEBP)
   - Sélectionnez Pôle et Filière
   - Entrez le prix unitaire
4. Cliquez sur **Enregistrer**

L'image est automatiquement uploadée et stockée dans la base de données.

#### Modifier un article
1. Dans la liste des articles, cliquez sur **Modifier**
2. Mettez à jour les informations
3. Pour changer l'image, sélectionnez une nouvelle image
4. Cliquez sur **Enregistrer**

La nouvelle image remplace l'ancienne.

#### Supprimer un article
1. Cliquez sur **Supprimer** (icône poubelle)
2. Confirmez la suppression

### 11.4 Gestion des stocks

#### Ajouter une entrée de stock
1. Allez dans **Entrées**
2. Cliquez sur **+ Nouvelle entrée**
3. Sélectionnez un article
4. Entrez la quantité
5. Entrez le prix unitaire
6. Cliquez sur **Enregistrer**

La quantité en stock augmente automatiquement.

#### Ajouter une sortie de stock
1. Allez dans **Sorties**
2. Cliquez sur **+ Nouvelle sortie**
3. Sélectionnez un article
4. Entrez la quantité
5. Un "Bon de sortie" est automatiquement généré
6. Cliquez sur **Enregistrer**

La quantité en stock diminue automatiquement.

### 11.5 Gestion des utilisateurs (Admin seulement)

1. Allez dans **Utilisateurs**
2. Vous verrez une liste avec le **Statut** de chaque utilisateur
3. Pour **approuver** un utilisateur en attente :
   - Cliquez sur le statut **"En attente"**
   - Sélectionnez **"Approuver"**
   - L'utilisateur reçoit une notification

4. Pour **refuser** un utilisateur :
   - Cliquez sur le statut
   - Sélectionnez **"Refuser"**
   - L'utilisateur reçoit une notification de refus

### 11.6 Notifications

- **Cloche en haut à droite** - Affiche le nombre de notifications non lues
- Cliquez sur la cloche pour voir la liste
- Les notifications se mettent à jour automatiquement
- Types de notifications :
  - Nouvel utilisateur à approuver
  - Nouvelle demande de produit
  - Approbation/refus de compte
  - Approbation/refus de demande

### 11.7 Rapports

1. Allez dans **Rapports**
2. Filtrez par **Pôle** et **Filière** si souhaité
3. Consultez les statistiques :
   - Total des articles
   - Quantités en stock
   - Mouvements

#### Exporter en PDF
- Cliquez sur **Télécharger PDF**
- Le fichier est téléchargé dans votre dossier Téléchargements

#### Exporter en CSV
- Cliquez sur **Télécharger CSV**
- Ouvrable dans Excel

### 11.8 Codes QR

Les articles incluent des codes QR :
1. Allez dans **Articles**
2. Chaque article affiche un code QR
3. Scannez le code avec un téléphone ou scanner QR
4. Le code dirige vers la page de détail de l'article

---

## 12. Tests API avec Postman

### 12.1 Installer Postman

Téléchargez depuis https://www.postman.com/downloads/

### 12.2 Authentification

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "Admin"
  }
}
```

Copiez ce token pour les prochaines requêtes. Allez dans l'onglet **Headers** et ajoutez :

**Key:** `Authorization`  
**Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (remplacez par votre token)

### 12.3 Consultation des utilisateurs

**Endpoint:** `GET http://localhost:5000/api/users`

**Headers:** (ajoutez votre token)

**Réponse:**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "Admin",
    "status": "active",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### 12.4 Consultation du stock

**Endpoint:** `GET http://localhost:5000/api/products`

**Headers:** (ajoutez votre token)

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "Article 1",
    "description": "Description",
    "quantity": 100,
    "unit_price": 25.50,
    "pole": "Pôle A",
    "filiere": "Filière 1",
    "image_url": "/uploads/products/image.jpg"
  }
]
```

### 12.5 Créer une entrée de stock

**Endpoint:** `POST http://localhost:5000/api/stock-entries`

**Body (JSON):**
```json
{
  "product_id": 1,
  "quantity": 50,
  "unit_price": 25.50,
  "reference": "ENTRY-001",
  "notes": "Nouvelle livraison"
}
```

**Réponse:** (201 Created)
```json
{
  "id": 1,
  "product_id": 1,
  "quantity": 50,
  "created_at": "2025-01-15T11:00:00Z"
}
```

### 12.6 Créer une sortie de stock

**Endpoint:** `POST http://localhost:5000/api/stock-outputs`

**Body (JSON):**
```json
{
  "product_id": 1,
  "quantity": 10,
  "destination": "Vente client",
  "reference": "OUTPUT-001"
}
```

**Réponse:** (201 Created)
```json
{
  "id": 1,
  "product_id": 1,
  "quantity": 10,
  "created_at": "2025-01-15T11:05:00Z",
  "bon_de_sortie_id": 1
}
```

---

## 13. Dépannage

### Problème : npm install error

**Symptôme:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```powershell
# Supprimez le dossier node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Réinstallez les dépendances
npm install --legacy-peer-deps
```

### Problème : PostgreSQL connection failed

**Symptôme:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Vérifications:**
1. PostgreSQL est-il lancé?
   ```powershell
   Get-Service postgresql*
   ```
   Le service doit avoir le **Status** "Running"

2. Les identifiants .env sont-ils corrects?
   ```bash
   DB_USER=postgres
   DB_PASSWORD=SecurePassword2025
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. Testez la connexion:
   ```powershell
   psql -U postgres -h localhost
   ```

### Problème : Port 5000 ou 5173 déjà utilisé

**Symptôme:**
```
Error: listen EADDRINUSE :::5000
```

**Solution - Trouver le processus:**
```powershell
# Trouvez le processus utilisant le port 5000
netstat -ano | findstr :5000
```

**Tuer le processus:**
```powershell
# Remplacez PID par le numéro trouvé
taskkill /PID 12345 /F
```

**Ou changez le port dans .env:**
```bash
PORT=5001  # Au lieu de 5000
```

### Problème : JWT invalid error

**Symptôme:**
```
JsonWebTokenError: invalid token
```

**Solution:**
1. Vérifiez que le header `Authorization` est correct:
   ```
   Authorization: Bearer <token_complet>
   ```

2. Le token a peut-être expiré. Reconvertissez-vous via l'API `/auth/login`

### Problème : Page blanche

**Symptôme:** Le frontend affiche une page vide

**Vérifications:**
1. La console du navigateur (F12) affiche-t-elle des erreurs?
2. Le backend est-il lancé sur le port 5000?
3. Vérifiez que `VITE_API_URL` dans `.env.local` est `http://localhost:5000`

**Solution:**
```powershell
# Redémarrez le frontend
cd frontend
npm run dev
```

### Problème : Login impossible

**Symptôme:** Email/mot de passe rejetés même si corrects

**Causes possibles:**
1. Le compte est en attente d'approbation ? Contactez un administrateur
2. Le compte a été refusé ? Créez un nouveau compte
3. La base de données n'a pas les données d'initialisation

**Solution:**
```powershell
# Réinitialisez la base de données
cd backend
node scripts/seed.js
cd ..
```

---

## 14. Sécurité

### 14.1 JWT (JSON Web Token)

**Qu'est-ce que c'est?**
- Système de token cryptographique pour l'authentification
- Le token est créé lors de la connexion
- Envoyé dans chaque requête API (header `Authorization`)
- Expire après 24 heures par défaut

**Bonnes pratiques:**
- Gardez votre `JWT_SECRET` secret (changez-le en production!)
- Ne partagez jamais votre token
- Utilisez HTTPS en production (pas HTTP)

### 14.2 BCrypt

**Qu'est-ce que c'est?**
- Algorithme de hachage sécurisé pour les mots de passe
- Les mots de passe ne sont jamais stockés en clair
- Impossible de les récupérer (même pour les admins)

**Bonnes pratiques:**
- Utilisez des mots de passe forts (min 8 caractères)
- Combinez majuscules, minuscules, chiffres et caractères spéciaux

### 14.3 RBAC (Role-Based Access Control)

**Rôles implémentés:**
- **Admin** - Accès complet
- **Responsable** - Gestion des stocks + rapports
- **Utilisateur** - Consultation + demandes

**Contrôle des routes:**
```javascript
// Exemple: seul les Admins peuvent approuver des utilisateurs
router.post('/users/:id/approve', adminOnly, approveUser);
```

### 14.4 Protection des routes

- Les routes API exigent un token JWT valide
- Les tokens expirent automatiquement
- Les rôles sont vérifiés pour chaque action sensible

---

## 15. Conclusion

Vous avez maintenant une installation complète de **StockFlow CMC** fonctionnelle sur votre machine Windows.

### Prochaines étapes

1. **Explorez l'application** - Créez des articles, gérez les stocks
2. **Créez des utilisateurs** - Testez le système d'approbation
3. **Consultez les rapports** - Analysez vos données
4. **Configurez vos données** - Importez vos propres articles et valeurs

### Support

En cas de problème :
1. Consultez la section **Dépannage** (Chapitre 13)
2. Vérifiez les logs du backend dans le terminal
3. Vérifiez la console du navigateur (F12)
4. Vérifiez la connexion à PostgreSQL

### Pour plus d'information

- **Documentation API:** Consultez `backend/routes/`
- **Structure frontend:** Consultez `frontend/src/`
- **Modèles de données:** Consultez `backend/models/`

---

**StockFlow CMC v1.0**  
*Système de gestion d'inventaire professionnel pour la CMA Casablanca-Settat*

