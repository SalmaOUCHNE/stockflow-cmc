# 📝 Notes de Développement - Module Utilisateurs

## Architecture générale

### Flux d'une requête

```
Frontend (React)
    ↓
usersService.js (axios avec interceptor JWT)
    ↓
Backend Express (http://localhost:3000/api)
    ↓
routes/users.routes.js (authMiddleware + requireRole)
    ↓
controllers/users.controller.js (validation, logique)
    ↓
services/users.service.js (requêtes PostgreSQL)
    ↓
PostgreSQL Database
    ↓
auditService.js (log l'action)
```

---

## Détails implémentation

### 1. Génération mot de passe temporaire

```javascript
// 12 caractères : 1 majuscule + 1 chiffre + 1 spécial + 9 mixtes
generateTempPassword() → "X3@aBcDeFgH"
```

- Hash bcrypt salt 12
- Jamais stocké en plaintext
- Envoyé par email (console.log en simulation)

### 2. Authentification JWT

**Token structure :**
```json
{
  "id": "uuid-user",
  "email": "user@cmc.ma",
  "role": "Admin",
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Expiration :** 30 minutes (JWT_EXPIRY=30m)

**Stockage frontend :** localStorage.auth_token

### 3. Audit logging

```javascript
audit_logs {
  action: "CREATE_USER" | "UPDATE_USER" | "DELETE_USER" | etc.
  entite_cible: "users"
  entite_id: uuid
  user_id: uuid (qui a fait l'action)
  ip_address: "192.168.1.1"
  details: { champs_modifies: {...} }
  created_at: TIMESTAMP
}
```

### 4. Permissions - Double protection

**Backend :**
```javascript
// Route protégée
router.use(authMiddleware);        // ✅ Vérifie JWT
router.use(requireRole('Admin'));  // ✅ Vérifie rôle
```

**Frontend :**
```jsx
<ProtectedRoute>
  <UsersPage />
</ProtectedRoute>
```

### 5. Gestion des erreurs

| Code | Raison | Exemple |
|------|--------|---------|
| 400 | Validation | Email invalide |
| 401 | Pas de token | Token expiré |
| 403 | Pas l'Admin | Rôle insuffisant |
| 404 | Pas trouvé | User non existant |
| 409 | Conflit | Email déjà utilisé |
| 500 | Serveur | Erreur BD |

---

## Points d'extension

### 1. Intégration email réelle

Remplacer `email.service.js` :

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

await transporter.sendMail({
  to: email,
  subject: 'Votre compte StockFlow CMC',
  html: template(nom, prenom, tempPassword)
});
```

### 2. Intégration authentification

Créer `routes/auth.routes.js` :

```javascript
POST /api/auth/login
  - Email + mot de passe
  - Retour JWT + refresh token

POST /api/auth/refresh
  - Refresh token
  - Retour nouveau JWT

POST /api/auth/logout
  - Invalidate refresh token
```

### 3. Soft delete (au lieu de suppression)

Remplacer `deleted_at` :

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Service
SELECT ... WHERE deleted_at IS NULL;
```

### 4. Rate limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### 5. Logging centralisé

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Tests unitaires (optionnel)

### Backend (Jest)

```javascript
describe('usersService', () => {
  test('createUser génère mot de passe temporaire', async () => {
    const user = await usersService.createUser({...});
    expect(user).toBeDefined();
    expect(user.password_hash).toMatch(/^\$2[aby]$\d{1,3}\$/);
  });

  test('getUsers applique les filtres', async () => {
    const result = await usersService.getUsers({
      role: 'Admin',
      page: 1,
      limit: 10
    });
    expect(result.users.every(u => u.role_id === 'Admin')).toBe(true);
  });
});
```

### Frontend (Vitest)

```javascript
describe('usersService', () => {
  test('getUsers appelle /api/users', async () => {
    const result = await usersService.getUsers({page: 1});
    expect(result.users).toBeDefined();
  });
});
```

---

## Performance

### Optimisations

1. **Indexes PostgreSQL** (déjà dans schema.sql)
   - users(email)
   - users(role_id)
   - users(is_active)

2. **Pagination obligatoire**
   - Jamais récupérer tous les users d'un coup
   - Limit max: 100

3. **Caching frontend** (optionnel)
   ```javascript
   import { useQuery } from '@tanstack/react-query';
   
   const { data } = useQuery({
     queryKey: ['users', filters],
     queryFn: () => usersService.getUsers(filters),
     staleTime: 5 * 60 * 1000 // 5 min
   });
   ```

4. **Lazy loading composants**
   ```javascript
   const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
   ```

---

## Sécurité - Checklist

- [ ] Password hash bcrypt (pas MD5/SHA1)
- [ ] JWT secret complexe (min 32 chars)
- [ ] CORS restreint en production
- [ ] SQL injection impossible (paramètres)
- [ ] XSS protection (React escapes par défaut)
- [ ] CSRF token si formulaires POST
- [ ] Validation input côté serveur
- [ ] Sanitize outputs (validation)
- [ ] Rate limiting sur auth
- [ ] HTTPS en production
- [ ] Secrets pas commités (.env)
- [ ] Audit trail complet

---

## Déploiement

### Variables d'environnement en prod

```bash
# Backend
PORT=3000
DB_HOST=db.prod.internal
DB_NAME=stockflow_prod
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.stockflow.ma
```

### Docker (optionnel)

```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

---

## Support des anciennes versions

Actuellement : pas de v1 → v2 migration
Si besoin : utiliser Flyway/Liquibase pour migrations BD

---

## Contacts & Debug

Pour les erreurs courantes :

1. **"Erreur de connexion à la BD"**
   - Vérifier DB_HOST, DB_PORT, credentials
   - Vérifier que PostgreSQL est up : `pg_isready`

2. **"Token invalide ou expiré"**
   - Vérifier JWT_SECRET identique
   - Vérifier format : `Bearer <token>`

3. **"Email déjà utilisé"**
   - Vérifier unique constraint sur email
   - Vérifier pas de doublons : `SELECT DISTINCT email FROM users;`

4. **"CORS error"**
   - Vérifier CORS settings dans server.js
   - Vérifier VITE_API_URL

