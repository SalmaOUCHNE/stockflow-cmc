# 🔐 CORRIGER LE FLUX D'AUTHENTIFICATION - RÉSUMÉ DES FIXES

## 🎯 Problème Identifié
L'utilisateur se déconnecte immédiatement après la connexion car le token n'est pas correctement transmis lors de la requête `/users/me`.

## ❌ Problèmes Découverts

### 1. **Login.tsx** - Doublon de sauvegarde du token
```typescript
// AVANT (PROBLÈME)
localStorage.setItem("token", data.token || data.access_token);  // ligne 36
// ...
localStorage.setItem('token', data.token);                        // ligne 43 - overwrite!

// APRÈS (CORRIGÉ)
localStorage.setItem('token', data.token);  // Une seule fois, après validation
```

### 2. **Login.tsx** - Validation de réponse TOO LATE
```typescript
// AVANT (PROBLÈME)
localStorage.setItem("token", data.token || data.access_token);
if (!data || !(data.token || data.access_token)) {
  throw new Error(...);  // Vérification APRÈS sauvegarde!
}

// APRÈS (CORRIGÉ)
if (!data || !data.token || !data.user) {
  throw new Error(...);  // Vérification AVANT sauvegarde!
}
localStorage.setItem('token', data.token);
```

### 3. **Login.tsx** - Redirection dupliquée et window.location.href
```typescript
// AVANT (PROBLÈME)
window.dispatchEvent(new Event('stockflow-auth'));  // ligne 47
window.dispatchEvent(new Event('stockflow-auth'));  // ligne 52 - DUPLIQUÉ!
window.location.href = ...                          // Rechargement complet

// APRÈS (CORRIGÉ)
window.dispatchEvent(new Event('stockflow-auth'));  // Une seule fois
setTimeout(() => navigate(...), 100);               // React Router navigation
```

### 4. **Login.tsx** - useEffect redirection prématurée
```typescript
// AVANT (PROBLÈME)
useEffect(() => {
  if (user) navigate(...);  // Peut rediriger AVANT hydration
}, [user, roles, navigate]);

// APRÈS (CORRIGÉ)
useEffect(() => {
  if (user && roles.length > 0) {
    navigate(...);  // Redirection APRÈS hydration complète
  }
}, [user, roles, navigate]);
```

### 5. **useAuth.tsx** - Logique d'hydratation imprécise
```typescript
// AVANT (PROBLÈME)
const token = localStorage.getItem("token") || sessionData.access_token;
if (!token) {
  // Utilise données cachées SANS valider
  if (sessionData?.user) { setUser(...); }
}
// Puis appelle /users/me avec le token

// APRÈS (CORRIGÉ)
const token = localStorage.getItem("token");
if (!token) {
  // Utilise données cachées SI pas de token
  if (cachedUser) { setUser(...); }
  setLoading(false);
  return;
}
// PUIS appelle /users/me pour valider le token
try {
  const { data } = await api.get('/users/me');
  setUser(data);
} catch (e) {
  if (is401 || is403) {
    localStorage.removeItem('token');
    setUser(null);
  }
}
```

### 6. **api.ts** - Absence de logs détaillés
```typescript
// AVANT (PROBLÈME)
api.interceptors.request.use((config) => {
  // Pas de logs!
  if (token) config.headers.Authorization = `Bearer ${token}`;
});

// APRÈS (CORRIGÉ)
api.interceptors.request.use((config) => {
  console.log(`[AXIOS] ${method} ${url} - token present: ${!!token}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[AXIOS] Added Authorization header: Bearer ${token.substring(0, 20)}...`);
  }
});

api.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS] ✓ ${method} ${url} - status: ${status}`);
    return response;
  },
  (error) => {
    console.error(`[AXIOS] ✗ ${method} ${url} - status: ${status || 'no response'}`);
    if (status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("stockflow-auth"));
    }
  }
);
```

### 7. **ProtectedRoute.tsx** - Vérification insuffisante
```typescript
// AVANT (PROBLÈME)
if (!user && !localStorage.getItem("token")) {
  return <Navigate to="/login" replace />;
}

// APRÈS (CORRIGÉ)
const token = localStorage.getItem("token");
if (loading) {
  return <spinner />;  // Wait for hydration
}
if (!user && !token) {
  console.log('[PROTECTED_ROUTE] No user and no token, redirecting to /login');
  return <Navigate to="/login" replace />;
}
```

## ✅ Corrections Appliquées

### Fichier 1: `frontend/src/pages/Login.tsx`
- ✓ Validation de réponse AVANT sauvegarde
- ✓ Sauvegarde du token une seule fois
- ✓ Event dispatch une seule fois
- ✓ Utilisation de `navigate()` au lieu de `window.location.href`
- ✓ Redirection dupliquée supprimée
- ✓ Logs détaillés avec `[LOGIN]` tag

### Fichier 2: `frontend/src/hooks/useAuth.tsx`
- ✓ Hydratation logique simplifiée et clarifiée
- ✓ Validation du token APRÈS obtention du token
- ✓ Gestion des erreurs 401/403 correcte
- ✓ Gestion des erreurs réseau correcte (keep token)
- ✓ Logs détaillés avec `[HYDRATE]` et `[USEAUTH]` tags

### Fichier 3: `frontend/src/services/api.ts`
- ✓ Interceptor request avec logs détaillés
- ✓ Interceptor response avec logs pour succès et erreurs
- ✓ Header `Authorization: Bearer <token>` correctement positionné
- ✓ Clearing du token sur 401 (dans response interceptor)
- ✓ Logs avec `[AXIOS]` tag

### Fichier 4: `frontend/src/components/app/ProtectedRoute.tsx`
- ✓ Vérification claire du loading state
- ✓ Logs détaillés avec `[PROTECTED_ROUTE]` tag
- ✓ Gestion correcte du timing de redirection
- ✓ Pas de redirection avant hydration complète

## 🔍 Logs de Débogage Disponibles

### Pour déboguer, ouvrez la console (F12) et cherchez:
```
[LOGIN]              - Actions de connexion
[AXIOS]              - Requêtes HTTP (demande et réponse)
[HYDRATE]            - Hydratation du contexte auth
[USEAUTH]            - Actions du hook useAuth
[AUTH MIDDLEWARE]    - Middleware JWT backend
[PROTECTED_ROUTE]    - Protection des routes
```

## 🚀 Flux Correct Après Fix

```
1. [LOGIN] User clicks login button
   ↓
2. [LOGIN] POST /auth/login → VALIDATE response
   ↓
3. [LOGIN] localStorage.setItem('token', data.token)
   ↓
4. [LOGIN] localStorage.setItem('user', data.user)
   ↓
5. [LOGIN] dispatchEvent('stockflow-auth')
   ↓
6. [USEAUTH] Hears event, calls hydrate()
   ↓
7. [HYDRATE] Gets token from localStorage
   ↓
8. [AXIOS] GET /users/me WITH Authorization header
   ↓
9. [AXIOS] Response: user data
   ↓
10. [HYDRATE] Sets user, roles in context
    ↓
11. [LOGIN] setTimeout → navigate(/dashboard or /portal/dashboard)
    ↓
12. [PROTECTED_ROUTE] loading=false, user exists, roles exist
    ↓
13. ✓ Access granted!
```

## ❌ Ancien Flux Cassé

```
1. [LOGIN] POST /auth/login
2. localStorage.setItem("token", undefined) 👈 PROBLÈME!
3. [HYDRATE] token = undefined
4. [AXIOS] GET /users/me WITHOUT Authorization header
5. [AUTH MIDDLEWARE] "Token manquant" → 401
6. [AXIOS] Clears token from localStorage
7. User redirected to /login
8. ✗ Infinite loop!
```

## 🧪 Pour Tester

1. **Ouvrir la console**: F12 → Console
2. **Login avec un compte valide**
3. **Vérifier les logs**:
   ```
   [LOGIN] attempting login for: admin@cmc.ma
   [LOGIN] response received: {hasData: true, hasToken: true, hasUser: true, ...}
   [LOGIN] validation passed, saving to localStorage
   [LOGIN] saved token and user, dispatching stockflow-auth event
   [AXIOS] POST /auth/login - status: 200
   [HYDRATE] Starting hydration...
   [HYDRATE] Token from localStorage: abc123...
   [AXIOS] GET /users/me - token present: true
   [AXIOS] Added Authorization header: Bearer abc123...
   [AXIOS] ✓ GET /users/me - status: 200
   [HYDRATE] ✓ /users/me succeeded: {userId: 1, email: admin@cmc.ma, role: admin}
   [PROTECTED_ROUTE] {loading: false, userExists: true, roles: ['admin'], isAdmin: true}
   [PROTECTED_ROUTE] ✓ Access granted
   ```

## 🔒 Remarques de Sécurité

- ✓ Token stocké en localStorage (accessible par JavaScript)
- ✓ Token inclus dans `Authorization: Bearer <token>` header
- ✓ Token supprimé sur 401 (invalide/expiré)
- ✓ Token kept on 5xx/network errors (retry logic)
- ⚠️ Envisager sessionStorage pour plus de sécurité (XSS)
- ⚠️ Implémenter token refresh avant expiration (24h)

## 📋 Checklist de Vérification

- [ ] Backend retourne `{ token, user: {...} }`
- [ ] Frontend log `[LOGIN] response received: {hasToken: true, hasUser: true}`
- [ ] Token est sauvegardé dans localStorage
- [ ] Event `stockflow-auth` est dispatché
- [ ] `[HYDRATE]` log montre token trouvé
- [ ] `[AXIOS]` GET /users/me a `Authorization` header
- [ ] `/users/me` retourne 200 avec user data
- [ ] Utilisateur est redirigé au bon dashboard
