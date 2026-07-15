# 🚀 Quick Start - Module Gestion des Utilisateurs

## Installation Express (5 minutes)

### Backend

```bash
# 1. Créer la base de données
createdb stockflow

# 2. Charger le schéma
psql -U postgres -d stockflow -f backend/schema.sql

# 3. Configurer l'environnement
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Installer et démarrer
npm install
npm run dev
```

✅ Backend prêt sur http://localhost:3000

### Frontend

```bash
# 1. Installer dépendances
npm install axios date-fns

# 2. Ajouter la configuration
echo 'VITE_API_URL=http://localhost:3000/api' >> .env.local

# 3. Ajouter la route dans votre routeur
# Voir INTEGRATION_USERS_MODULE.md
```

✅ Frontend prêt

---

## 📁 Fichiers créés

### Backend
```
backend/
├── routes/users.routes.js ..................... Routes API
├── controllers/users.controller.js ........... Logique métier
├── services/
│   ├── users.service.js ..................... Requêtes BD
│   ├── audit.service.js ..................... Audit logging
│   └── email.service.js ..................... Envoi emails
├── middlewares/auth.middleware.js ........... JWT + Rôles
├── config/database.js ....................... Pool PostgreSQL
├── server.js ............................... Serveur Express
├── schema.sql .............................. Schéma BD
├── package.json
├── .env.example
└── README.md ............................... Doc backend
```

### Frontend
```
src/
├── pages/admin/UsersPage.jsx ................ Page principale
├── components/users/
│   ├── UserTable.jsx ....................... Tableau
│   ├── UserForm.jsx ........................ Modale
│   ├── UserFilters.jsx ..................... Filtres
│   └── UserActions.jsx ..................... Actions
└── services/usersService.js ................ API client
```

### Docs
```
INTEGRATION_USERS_MODULE.md ................. Guide intégration
USERS_MODULE_ROADMAP.md ..................... Roadmap complète
QUICK_START.md (ce fichier)
```

---

## 🔑 Points clés

| Feature | Status |
|---------|--------|
| CRUD utilisateurs | ✅ |
| Pagination | ✅ |
| Filtres (rôle, statut, recherche) | ✅ |
| Activation/Désactivation | ✅ |
| Génération mot de passe temporaire | ✅ |
| Hash bcrypt (salt: 12) | ✅ |
| Audit logging | ✅ |
| JWT protection | ✅ |
| Admin requis | ✅ |
| Impossible modifier propre rôle | ✅ |
| Suppression avec confirmation | ✅ |
| Vérification email unique | ✅ |
| Vérification mouvements stock | ✅ |

---

## 🧪 Test rapide

### 1. Créer un admin (Supabase ou direct en BD)

### 2. Récupérer le JWT
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmc.ma","password":"..."}'
```

### 3. Tester endpoint users
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/users?page=1&limit=10
```

### 4. Ouvrir dans le navigateur
```
http://localhost:5173/admin/users
```

---

## ⚠️ Avant de commit

- [ ] `.env` n'est PAS commité (ajouter `backend/.env` à .gitignore)
- [ ] JWT_SECRET est complexe et unique
- [ ] PostgreSQL est en cours d'exécution
- [ ] Tous les fichiers sont en UTF-8
- [ ] Pas de console.logs de debug
- [ ] Code formaté et lintable

---

## 📞 Support

Voir les fichiers README pour plus de détails :
- `backend/README.md` - API documentation
- `INTEGRATION_USERS_MODULE.md` - Intégration frontend
- `USERS_MODULE_ROADMAP.md` - Architecture complète

