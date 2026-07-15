# 🧪 TESTING & VERIFICATION GUIDE

## 📋 Checklist de Déploiement

### Phase 1: Vérification des fichiers modifiés
- [ ] `frontend/src/pages/Login.tsx` - Fichier modifié
- [ ] `frontend/src/hooks/useAuth.tsx` - Fichier modifié
- [ ] `frontend/src/services/api.ts` - Fichier modifié
- [ ] `frontend/src/components/app/ProtectedRoute.tsx` - Fichier modifié

### Phase 2: Test de connexion manuel

#### Test 1: Connexion admin
```bash
1. Ouvrir le navigateur → http://localhost:5173
2. Ouvrir DevTools (F12) → Console
3. Cliquer sur "Connexion Admin" ou entrer:
   - Email: admin@cmc.ma
   - Mot de passe: admin123
4. Vérifier les logs dans la console:
   [LOGIN] attempting login for: admin@cmc.ma
   [LOGIN] response received: {hasData: true, hasToken: true, hasUser: true, ...}
   [LOGIN] validation passed, saving to localStorage
   [AXIOS] POST /auth/login - status: 200
   [LOGIN] saved token and user, dispatching stockflow-auth event
   [HYDRATE] Starting hydration...
   [HYDRATE] Token from localStorage: abc123def...
   [AXIOS] GET /users/me - token present: true
   [AXIOS] Added Authorization header: Bearer abc123...
   [AXIOS] ✓ GET /users/me - status: 200
   [HYDRATE] ✓ /users/me succeeded: {userId: 1, email: admin@cmc.ma, role: admin}
   [LOGIN] useEffect - redirecting authenticated user, isAdmin: true
   [PROTECTED_ROUTE] ✓ Access granted
5. Doit être redirigé vers /dashboard
6. ✓ PAGE AFFICHÉE CORRECTEMENT
```

#### Test 2: Connexion utilisateur
```bash
1. Déconnecter (si connected)
2. Cliquer sur "Connexion Utilisateur" ou entrer:
   - Email: user@cmc.ma
   - Mot de passe: user123
3. Vérifier les mêmes logs mais avec role: 'utilisateur' ou 'user'
4. Doit être redirigé vers /portal/dashboard
5. ✓ PAGE AFFICHÉE CORRECTEMENT
```

#### Test 3: Erreur de connexion
```bash
1. Entrer un mauvais mot de passe
2. Vérifier:
   [LOGIN] attempting login for: admin@cmc.ma
   [AXIOS] POST /auth/login - status: 401
   [AXIOS] ✗ POST /auth/login - status: 401
   error: 'Mot de passe incorrect'
3. Message d'erreur affiché
4. Rester sur la page /login
5. ✓ GESTION D'ERREUR CORRECTE
```

#### Test 4: Token invalide
```bash
1. Connexion réussie
2. Dans DevTools > Application > LocalStorage:
   - Chercher 'token'
   - Modifier le token (ajouter des caractères aléatoires)
3. Rafraîchir la page (F5)
4. Vérifier les logs:
   [HYDRATE] Token from localStorage: xyz...
   [AXIOS] GET /users/me - token present: true
   [AXIOS] Added Authorization header: Bearer xyz...
   [AXIOS] ✗ GET /users/me - status: 401
   [HYDRATE] Token is invalid (401/403), clearing
5. Doit être redirigé vers /login
6. Token doit être effacé de localStorage
7. ✓ TOKEN INVALIDE CORRECTEMENT GÉRÉ
```

#### Test 5: Persistance de la session
```bash
1. Connexion réussie
2. Rafraîchir la page (F5)
3. Vérifier les logs:
   [USEAUTH] Initial mount, calling hydrate
   [HYDRATE] Starting hydration...
   [HYDRATE] Token from localStorage: abc123...
   [AXIOS] GET /users/me - token present: true
   [AXIOS] ✓ GET /users/me - status: 200
   [HYDRATE] ✓ /users/me succeeded
4. Pas de redirection vers /login
5. Page doit rester au même endroit
6. ✓ PERSISTANCE CORRECTE
```

#### Test 6: Accès protégé
```bash
1. Connecté en tant qu'admin
2. Essayer d'accéder à /portal/dashboard
3. Vérifier les logs:
   [PROTECTED_ROUTE] {loading: false, userExists: true, isAdmin: true, nonAdminOnly: true}
   [PROTECTED_ROUTE] Non-admin-only route, user IS admin, redirecting to /dashboard
4. Redirigé vers /dashboard
5. Essayer d'accéder à /dashboard en tant qu'utilisateur
6. Vérifier les logs:
   [PROTECTED_ROUTE] {loading: false, userExists: true, isAdmin: false, adminOnly: true}
   [PROTECTED_ROUTE] Admin-only route, user is not admin, redirecting to /portal/dashboard
7. Redirigé vers /portal/dashboard
8. ✓ PROTECTIONS CORRECTES
```

## 🔍 Logs Attendus pour Chaque Action

### Connexion initiale (admin)
```
[LOGIN] attempting login for: admin@cmc.ma
[AXIOS] POST /auth/login - token present: false
[AXIOS] ✓ POST /auth/login - status: 200
[LOGIN] response received: {hasData: true, hasToken: true, hasUser: true, userId: 1, userRole: admin}
[LOGIN] validation passed, saving to localStorage
[LOGIN] saved token and user, dispatching stockflow-auth event
[AXIOS] GET /users/me - token present: true
[AXIOS] Added Authorization header: Bearer eyJ...
[HYDRATE] Starting hydration...
[HYDRATE] Token from localStorage: eyJ...
[HYDRATE] Token found, validating with GET /users/me
[AXIOS] ✓ GET /users/me - status: 200
[HYDRATE] ✓ /users/me succeeded: {userId: 1, email: admin@cmc.ma, role: admin}
[HYDRATE] Hydration complete, loading = false
[PROTECTED_ROUTE] {loading: false, userExists: true, userEmail: admin@cmc.ma, tokenExists: true, roles: ["admin"], isAdmin: true, adminOnly: true}
[PROTECTED_ROUTE] ✓ Access granted
[LOGIN] useEffect - redirecting authenticated user, isAdmin: true
[LOGIN] navigating to dashboard for role: admin
```

### Rafraîchissement de page
```
[USEAUTH] Initial mount, calling hydrate
[HYDRATE] Starting hydration...
[HYDRATE] Token from localStorage: eyJ...
[HYDRATE] Token found, validating with GET /users/me
[AXIOS] GET /users/me - token present: true
[AXIOS] Added Authorization header: Bearer eyJ...
[AXIOS] ✓ GET /users/me - status: 200
[HYDRATE] ✓ /users/me succeeded: {userId: 1, email: admin@cmc.ma, role: admin}
[HYDRATE] Hydration complete, loading = false
[PROTECTED_ROUTE] {loading: false, userExists: true, userEmail: admin@cmc.ma, roles: ["admin"], isAdmin: true}
[PROTECTED_ROUTE] ✓ Access granted
```

### Déconnexion
```
[USEAUTH] signOut called
[USEAUTH] Storage or stockflow-auth event triggered, calling hydrate
[HYDRATE] Starting hydration...
[HYDRATE] Token from localStorage: NOT FOUND
[HYDRATE] No token found, checking for cached user data
[HYDRATE] No cached user, user is logged out
[HYDRATE] Hydration complete, loading = false
[PROTECTED_ROUTE] {loading: false, userExists: false, tokenExists: false, roles: [], isAdmin: false}
[PROTECTED_ROUTE] No user and no token, redirecting to /login
```

## 📊 Résultats Attendus

### Avant fix ❌
```
[LOGIN] attempting login for: admin@cmc.ma
[AXIOS] POST /auth/login - status: 200
[LOGIN] saved token and user, dispatching stockflow-auth event
[AXIOS] GET /users/me - token present: false  👈 PROBLÈME: Token pas envoyé!
[AXIOS] ✗ GET /users/me - status: 401
[AXIOS] 401 Unauthorized - clearing token
[HYDRATE] Token is invalid (401/403), clearing
→ Redirection vers /login (Infinite loop)
```

### Après fix ✓
```
[LOGIN] attempting login for: admin@cmc.ma
[AXIOS] POST /auth/login - status: 200
[LOGIN] saved token and user, dispatching stockflow-auth event
[AXIOS] GET /users/me - token present: true
[AXIOS] Added Authorization header: Bearer ...  👈 CORRIGÉ: Header ajouté!
[AXIOS] ✓ GET /users/me - status: 200
[HYDRATE] ✓ /users/me succeeded
→ Accès au dashboard ✓
```

## 🛠️ Debug Tips

### Si les logs ne s'affichent pas:
1. Ouvrir la console: F12 → Console
2. S'assurer que le niveau de log est "Verbose" ou "All"
3. Chercher les tags: [LOGIN], [AXIOS], [HYDRATE], [PROTECTED_ROUTE]
4. Vérifier que localStorage n'est pas bloqué

### Si le token n'est pas envoyé:
1. Dans DevTools → Application → LocalStorage
2. Chercher la clé "token"
3. Copier la valeur et vérifier qu'elle n'est pas vide/undefined
4. Vérifier dans Network tab que l'header Authorization est présent

### Si la redirection échoue:
1. Vérifier l'URL après redirection
2. Vérifier les logs de [PROTECTED_ROUTE]
3. Vérifier que les roles sont correctement chargés
4. Vérifier que loading passe à false

## 🔒 Sécurité

- ✓ Token stocké en localStorage (accessible par JS)
- ✓ Token inclus dans Authorization header
- ✓ Token supprimé sur 401
- ✓ Token gardé sur erreurs réseau (retry logic)
- ⚠️ Considérer sessionStorage pour plus de sécurité
- ⚠️ Implémenter token refresh avant expiration

## 📝 Notes

- Les logs sont très détaillés pour le débogage
- Envisager de les désactiver en production (process.env.NODE_ENV)
- Tous les logs utilisent des prefixes distincts pour filtrer
- Les timestamps ne sont pas inclus (ajouter si nécessaire)
