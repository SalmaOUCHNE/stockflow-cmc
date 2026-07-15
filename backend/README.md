# StockFlow CMC - Backend API

API Node.js/Express pour la gestion des utilisateurs et du stock.

## Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de la base de données

1. Créer une base de données PostgreSQL :
```sql
CREATE DATABASE stockflow;
```

2. Charger le schéma :
```bash
psql -U postgres -d stockflow -f schema.sql
```

### 3. Variables d'environnement

Copier `.env.example` en `.env` et adapter :

```bash
cp .env.example .env
```

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockflow
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=votre_clé_secrète_très_complexe
JWT_EXPIRY=30m
```

### 4. Démarrer le serveur

**Mode développement (avec rechargement) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## API Endpoints

### Gestion des utilisateurs (protégés - Admin requis)

#### GET /api/users
Récupérer la liste des utilisateurs

**Query params :**
- `page` (default: 1)
- `limit` (default: 10)
- `role` : filtrer par rôle
- `is_active` : true/false
- `search` : recherche sur nom/prénom/email

**Réponse :**
```json
{
  "users": [...],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

#### GET /api/users/:id
Récupérer les détails d'un utilisateur

#### POST /api/users
Créer un utilisateur

**Body :**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@cmc.ma",
  "role_id": "Admin",
  "pole_id": "Magasin 1"
}
```

#### PUT /api/users/:id
Modifier un utilisateur

**Body :** (tous les champs optionnels)
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom",
  "email": "nouvel.email@cmc.ma",
  "role_id": "Utilisateur"
}
```

#### PATCH /api/users/:id/toggle-status
Activer/Désactiver un utilisateur

#### PATCH /api/users/:id/role
Changer le rôle d'un utilisateur

**Body :**
```json
{
  "role_id": "Admin"
}
```

#### DELETE /api/users/:id
Supprimer un utilisateur

## Règles métier

- **[RG10]** : Seuls les Admin peuvent gérer les utilisateurs
- **[RG11]** : Expiration stricte des tokens JWT à 30 minutes
- Un utilisateur ne peut pas modifier son propre rôle
- Un utilisateur ne peut pas désactiver/supprimer son propre compte
- L'email doit être unique
- Un mot de passe temporaire est généré et envoyé par email lors de la création
- Toutes les actions sont enregistrées dans l'audit

## Structure du projet

```
backend/
├── routes/
│   └── users.routes.js
├── controllers/
│   └── users.controller.js
├── services/
│   ├── users.service.js
│   ├── audit.service.js
│   └── email.service.js
├── middlewares/
│   └── auth.middleware.js
├── config/
│   └── database.js
├── server.js
├── schema.sql
└── package.json
```

## Notes de développement

- Les mots de passe sont hashés avec bcrypt (salt: 12)
- Les tokens JWT expirent après 30 minutes
- Tous les mots de passe temporaires sont générés aléatoirement (12 caractères)
- L'audit enregistre l'IP et l'utilisateur pour chaque action
