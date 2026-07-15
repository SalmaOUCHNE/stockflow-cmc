# Module Gestion des Utilisateurs - Roadmap Complète

## 📋 Structure créée

### Backend (Node.js + Express + PostgreSQL)

#### Routes (`backend/routes/users.routes.js`)
- ✅ GET /api/users - Liste avec filtres & pagination
- ✅ GET /api/users/:id - Détails utilisateur
- ✅ POST /api/users - Créer utilisateur
- ✅ PUT /api/users/:id - Modifier utilisateur
- ✅ PATCH /api/users/:id/toggle-status - Activer/Désactiver
- ✅ PATCH /api/users/:id/role - Changer rôle
- ✅ DELETE /api/users/:id - Supprimer utilisateur

#### Contrôleurs (`backend/controllers/users.controller.js`)
- ✅ Validation des données
- ✅ Vérification des permissions (Admin requis)
- ✅ Gestion des erreurs (404, 409, 400)
- ✅ Intégration audit pour chaque action

#### Services
- ✅ **users.service.js** - Logique métier
  - Génération mot de passe temporaire (12 chars)
  - Hash bcrypt salt 12
  - Requêtes PostgreSQL avec paramètres
  - Vérification unicité email
  - Pagination
  
- ✅ **audit.service.js** - Enregistrement actions
  - Horodatage
  - IP utilisateur
  - Détails des changements
  
- ✅ **email.service.js** - Envoi emails (simulation console.log)

#### Middlewares (`backend/middlewares/auth.middleware.js`)
- ✅ authMiddleware - Vérification JWT
- ✅ requireRole('Admin') - Protection par rôle

#### Configuration (`backend/config/database.js`)
- ✅ Pool PostgreSQL avec variables d'environnement

#### Fichiers de configuration
- ✅ `.env.example` - Variables d'environnement
- ✅ `package.json` - Dépendances Node.js
- ✅ `server.js` - Serveur Express principal
- ✅ `schema.sql` - Structure PostgreSQL complète

---

### Frontend (React + Vite + Tailwind CSS)

#### Service API (`src/services/usersService.js`)
- ✅ getUsers(filters) - Avec pagination & filtres
- ✅ getUserById(id)
- ✅ createUser(data)
- ✅ updateUser(id, data)
- ✅ toggleUserStatus(id)
- ✅ changeUserRole(id, roleId)
- ✅ deleteUser(id)
- ✅ Interceptor JWT automatique
- ✅ Gestion erreurs API

#### Page principale (`src/pages/admin/UsersPage.jsx`)
- ✅ Titre et description
- ✅ Bouton "Ajouter un utilisateur"
- ✅ Statistiques : total, actifs, inactifs, par rôle
- ✅ Intégration UserFilters
- ✅ Intégration UserTable avec actions
- ✅ Modale UserForm (création/édition)
- ✅ Notifications toast (succès/erreur)

#### Composants UI

**UserTable.jsx**
- ✅ Colonnes : Nom/Prénom, Email, Rôle, Statut, Dernière connexion, Actions
- ✅ Avatars colorés selon le rôle
- ✅ Badges avec couleurs distinctes par rôle
- ✅ Badges statut (Actif vert, Inactif gris)
- ✅ Dates relatives (il y a X jours)
- ✅ Ligne utilisateur connecté en évidence (badge "Vous")
- ✅ Ligne désactivée avec opacité réduite
- ✅ Pagination complète (10 par page)
- ✅ Intégration UserActions

**UserForm.jsx**
- ✅ Mode création & édition
- ✅ Champs : Prénom, Nom, Email, Rôle, Pôle (optionnel)
- ✅ Validation inline
- ✅ Message info pour création (mot de passe temporaire)
- ✅ Rôle désactivé pour son propre compte
- ✅ Dialogue confirmation
- ✅ Gestion loading

**UserFilters.jsx**
- ✅ Recherche (nom, prénom, email)
- ✅ Filtre rôle (Admin, Responsable Magasin, Utilisateur)
- ✅ Filtre statut (Actifs, Inactifs)
- ✅ Bouton réinitialiser filtres
- ✅ Icons pour meilleure UX

**UserActions.jsx**
- ✅ Menu déroulant (3 points)
- ✅ Actions : Modifier, Activer/Désactiver, Supprimer
- ✅ Actions désactivées pour l'utilisateur connecté
- ✅ Confirmations avec AlertDialog
- ✅ Messages d'avertissement clairs

---

## 🔒 Règles métier implémentées

- [RG10] ✅ Admin exclusif pour gestion utilisateurs
- [RG11] ✅ JWT expire à 30 minutes (configurable en .env)
- ✅ Impossible de modifier son propre rôle
- ✅ Impossible de désactiver/supprimer son propre compte
- ✅ Email unique
- ✅ Mot de passe temporaire généré et envoyé par email
- ✅ Suppression irréversible avec confirmation
- ✅ Audit enregistre : action, IP, horodatage, détails

---

## ⚙️ Installation & Configuration

### Backend

1. **Créer la BD** :
   ```bash
   createdb stockflow
   psql -U postgres -d stockflow -f backend/schema.sql
   ```

2. **Variables d'environnement** (`backend/.env`) :
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=stockflow
   DB_USER=postgres
   DB_PASSWORD=password
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRY=30m
   ```

3. **Dépendances & démarrage** :
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Frontend

1. **Dépendances** :
   ```bash
   npm install axios date-fns
   ```

2. **Variables d'environnement** (`.env.local`) :
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Ajouter route** dans le routeur :
   ```jsx
   import UsersPage from '@/pages/admin/UsersPage';
   
   {
     path: '/admin/users',
     element: <ProtectedRoute><UsersPage /></ProtectedRoute>,
     requiresRole: 'Admin'
   }
   ```

---

## 🎨 Styling

- Tailwind CSS pour tout
- Composants shadcn/ui : Button, Input, Select, Dialog, etc.
- Couleurs personnalisées selon rôles
- Responsive (mobile-first)

---

## ✅ Checklist avant production

- [ ] JWT_SECRET changé et complexe
- [ ] Variables d'environnement configurées
- [ ] PostgreSQL en production
- [ ] CORS configuré correctement
- [ ] Logs d'audit activés
- [ ] Rate limiting sur API (optionnel)
- [ ] HTTPS pour production
- [ ] Backup/Restore stratégie
- [ ] Tests E2E validés

---

## 📝 Notes

- Toutes les dates sont en UTC (PostgreSQL)
- Tous les emails sont simulés en console.log
- Pour email réel : remplacer par nodemailer/SendGrid
- Les tokens JWT sont stockés en localStorage
- CORS par défaut sur tous les domaines (à restreindre en prod)

