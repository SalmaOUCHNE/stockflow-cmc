# Integration Frontend - Module Gestion des Utilisateurs

## Setup

### 1. Ajouter les dépendances

```bash
npm install axios date-fns
```

### 2. Variables d'environnement

Ajouter à `.env.local` :

```
VITE_API_URL=http://localhost:3000/api
```

### 3. Ajouter la route dans le routeur

Dans `src/main.tsx` ou votre fichier de routes :

```jsx
import UsersPage from '@/pages/admin/UsersPage';

// Ajouter à votre configuration de routes
{
  path: '/admin/users',
  element: <ProtectedRoute><UsersPage /></ProtectedRoute>,
  requiresRole: 'Admin'
}
```

### 4. Intégration du service d'authentification

Le service `usersService` utilise automatiquement le token JWT stocké en `localStorage.auth_token`.

Assurez-vous que votre système d'authentification stocke le token à cette clé :

```javascript
// Exemple lors de la connexion
localStorage.setItem('auth_token', jwtToken);
```

## Fichiers créés

### Composants
- `src/pages/admin/UsersPage.jsx` - Page principale
- `src/components/users/UserTable.jsx` - Tableau avec pagination
- `src/components/users/UserForm.jsx` - Modale création/édition
- `src/components/users/UserFilters.jsx` - Barre de filtres
- `src/components/users/UserActions.jsx` - Actions (modifier, supprimer, activer/désactiver)

### Services
- `src/services/usersService.js` - Appels API

## Fonctionnalités

✅ Liste des utilisateurs avec pagination
✅ Filtres par rôle, statut, recherche
✅ Création d'utilisateurs
✅ Modification d'utilisateurs
✅ Activation/Désactivation
✅ Suppression avec confirmation
✅ Statistiques (total, actifs, inactifs)
✅ Notifications toast (succès/erreur)
✅ Impossible de modifier son propre compte
✅ Avatar avec initiales colorées selon le rôle
✅ Dernière connexion au format relatif

## Permissions

Le module vérifie automatiquement que l'utilisateur a le rôle 'Admin' côté backend.
Le frontend doit également vérifier la permission avec un composant ProtectedRoute.

## Styles Tailwind

Tous les composants utilisent :
- Tailwind CSS pour le styling
- Composants UI shadcn/ui
- Variables CSS pour les couleurs (bg-primary, bg-secondary, etc.)

## Gestion des erreurs

Les erreurs API sont automatiquement affichées via des toasts `sonner`.

Format d'erreur attendu du backend :
```json
{
  "error": "Message d'erreur descriptif"
}
```

## Performance

- Pagination : 10 utilisateurs par page
- Chargement lazy des données
- Debouncing de la recherche (optionnel)
- Caching des requêtes (optionnel avec React Query)

## Points de vérification

- [ ] Backend PostgreSQL configuré et en cours d'exécution
- [ ] Token JWT stocké dans localStorage.auth_token
- [ ] CORS activé sur le backend
- [ ] Rôle 'Admin' assigné à l'utilisateur connecté
- [ ] Variables d'environnement VITE_API_URL configurées
