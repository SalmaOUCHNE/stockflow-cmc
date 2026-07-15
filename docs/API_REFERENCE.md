# API Reference - Module Utilisateurs

## Base URL
```
http://localhost:3000/api
```

## Headers requis
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Endpoints

### GET /users
**Récupérer la liste des utilisateurs**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/users?page=1&limit=10&role=Admin&is_active=true&search=jean"
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 10, max: 100)
- `role` (string, optional) - "Admin" | "Responsable Magasin" | "Utilisateur"
- `is_active` (boolean, optional) - true | false
- `search` (string, optional) - recherche sur nom/prenom/email

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean@cmc.ma",
      "role_id": "Admin",
      "is_active": true,
      "last_login": "2026-06-01T10:30:00Z",
      "created_at": "2026-05-20T14:22:10Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

---

### GET /users/:id
**Récupérer un utilisateur spécifique**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@cmc.ma",
  "role_id": "Admin",
  "is_active": true,
  "last_login": "2026-06-01T10:30:00Z",
  "created_at": "2026-05-20T14:22:10Z"
}
```

---

### POST /users
**Créer un nouvel utilisateur**

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@cmc.ma",
    "role_id": "Utilisateur",
    "pole_id": "Magasin 1"
  }' \
  "http://localhost:3000/api/users"
```

**Body:**
```json
{
  "nom": "Dupont",              // requis
  "prenom": "Jean",              // requis
  "email": "jean@cmc.ma",        // requis, unique
  "role_id": "Admin",            // requis
  "pole_id": "Magasin 1"         // optionnel
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@cmc.ma",
  "role_id": "Utilisateur",
  "is_active": true,
  "last_login": null,
  "created_at": "2026-06-01T14:22:10Z"
}
```

**Erreurs:**
- `400` - Champs requis manquants
- `409` - Email déjà utilisé

---

### PUT /users/:id
**Modifier un utilisateur**

```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@cmc.ma",
    "role_id": "Admin"
  }' \
  "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000"
```

**Body (tous optionnels):**
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom",
  "email": "nouveau@cmc.ma",
  "role_id": "Admin"
}
```

**Response (200):**
- Utilisateur modifié

**Erreurs:**
- `404` - Utilisateur non trouvé
- `409` - Email déjà utilisé
- `400` - Impossible de modifier son propre rôle

---

### PATCH /users/:id/toggle-status
**Activer ou désactiver un utilisateur**

```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000/toggle-status"
```

**Body:** (vide)

**Response (200):**
```json
{
  "id": "uuid",
  "is_active": false,
  ...
}
```

**Erreurs:**
- `404` - Utilisateur non trouvé
- `400` - Impossible de désactiver son propre compte

---

### PATCH /users/:id/role
**Changer le rôle d'un utilisateur**

```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "role_id": "Admin" }' \
  "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000/role"
```

**Body:**
```json
{
  "role_id": "Admin"  // requis
}
```

**Response (200):**
- Utilisateur modifié avec nouveau rôle

**Erreurs:**
- `404` - Utilisateur non trouvé
- `400` - Impossible de changer son propre rôle
- `400` - role_id manquant

---

### DELETE /users/:id
**Supprimer un utilisateur**

```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000"
```

**Response (200):**
```json
{
  "message": "Utilisateur supprimé avec succès"
}
```

**Erreurs:**
- `404` - Utilisateur non trouvé
- `400` - Impossible de supprimer son propre compte
- `409` - Impossible de supprimer : l'utilisateur a des mouvements de stock

---

## Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (pas de token) |
| 403 | Forbidden (pas Admin) |
| 404 | Not Found |
| 409 | Conflict (email déjà utilisé, etc.) |
| 500 | Server Error |

---

## Formats de réponse d'erreur

```json
{
  "error": "Description de l'erreur"
}
```

---

## Rôles disponibles

- `"Admin"` - Accès complet
- `"Responsable Magasin"` - Accès étendu
- `"Utilisateur"` - Accès basique

---

## Format JWT

Le token JWT contient :
```json
{
  "id": "user-uuid",
  "email": "user@cmc.ma",
  "role": "Admin",
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Expiration :** 30 minutes

---

## Exemples d'utilisation

### JavaScript / Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// Récupérer les utilisateurs
const { data } = await api.get('/users?page=1&limit=10');

// Créer un utilisateur
const newUser = await api.post('/users', {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean@cmc.ma',
  role_id: 'Utilisateur'
});

// Modifier
await api.put(`/users/${userId}`, { nom: 'Nouveau' });

// Supprimer
await api.delete(`/users/${userId}`);
```

### cURL

```bash
# Liste
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/users?page=1"

# Créer
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Dupont",...}' \
  "http://localhost:3000/api/users"
```

---

## Notes

- Tous les IDs sont des UUID
- Toutes les dates sont en ISO 8601 (UTC)
- Les mots de passe ne sont jamais retournés
- Les tokens JWT expirent après 30 minutes
