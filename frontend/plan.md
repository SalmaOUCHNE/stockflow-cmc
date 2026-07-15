# Refonte StockFlow CMC — Mode 100% Mock

## État actuel
Le projet utilise déjà un mock partiel (`src/lib/mockSupabase.ts` + alias Vite redirigeant `@/integrations/supabase/client`). Les comptes démo existent. Mais :
- Le package `@supabase/supabase-js` est toujours installé et importé (types `User`, `Session`).
- Beaucoup de pages admin (Stock, Entries, Exits, Inventory, Users, Reports…) s'appuient sur l'API mock mais avec des fonctionnalités CRUD incomplètes ou décoratives.
- Pas de QR codes, pas de gestion d'expiration, pas d'export PDF/Excel uniformisé.

## Plan d'exécution (un seul lot de changements)

### 1. Suppression complète de Supabase
- Désinstaller `@supabase/supabase-js`.
- Remplacer `useAuth` par un AuthProvider 100% local (types `User`/`Session` maison, persistance `localStorage`).
- Réécrire `src/integrations/supabase/client.ts` en simple ré-export du mock (l'alias Vite est conservé pour compat).
- Remplacer `src/integrations/supabase/types.ts` par des types locaux minimaux.
- Vider `supabase/config.toml` côté usage (fichier conservé mais non utilisé runtime).
- Grep final : 0 import `@supabase/*` dans `src/`.

### 2. Auth fonctionnelle
- Comptes prédéfinis seedés dans localStorage au boot : admin@cmc.ma / admin123 (rôle admin) et user@cmc.ma / user123 (rôle internal_user, statut approved).
- Page Login : deux boutons « Connexion Admin » / « Connexion Utilisateur » qui pré-remplissent + soumettent.
- Redirection post-login selon rôle (admin → `/dashboard`, user → `/portal/dashboard`).
- Signup local fonctionnel (statut `pending`, validable par admin).

### 3. Données mock enrichies (`mockDb.ts`)
- 4 pôles, 8 filières, ~10 catégories, ~25 articles (avec image, prix, fournisseur, emplacement, dates achat/expiration pour consommables).
- ~30 mouvements (entrées/sorties) sur 90 jours.
- ~15 demandes couvrant tous les statuts (en_attente, approuvee, rejetee, preparation, disponible, livree, cloturee).
- 1 inventaire en cours + 1 clôturé.
- ~10 notifications, ~30 entrées audit log.
- 5 utilisateurs supplémentaires (mix admin/store_manager/internal_user + 2 pending).

### 4. QR Codes
- Ajout dépendance `qrcode.react`.
- Génération auto QR (payload = URL `/items/{id}`) dans la fiche article.
- Bouton « Imprimer QR » (window.print sur zone dédiée).
- Page `/scan` avec saisie/scan manuel d'un id pour ouvrir la fiche (scan caméra optionnel via `html5-qrcode` si simple, sinon input texte uniquement).

### 5. Expirations
- Champ `expires_at` exploité pour consommables.
- Helpers `daysUntilExpiry`, badges (Valide / Bientôt < 30j / Expiré).
- 3 KPI sur Dashboard admin : Expirés, Bientôt expirés, Valides.
- Page dédiée `/expirations` listant les articles concernés.
- Notifications auto seedées pour produits proches d'expirer.

### 6. CRUD réel partout
- Stock : ajouter / modifier / supprimer / rechercher / filtrer (catégorie, pôle, statut, expiration) / tri / pagination.
- Entrées et Sorties : création complète, modification statut workflow, rejet avec motif.
- Inventaire : démarrer session, saisir comptes, écarts auto, clôturer.
- Utilisateurs : approuver/rejeter pending, changer rôle, désactiver.
- Notifications : marquer lu / tout lire / supprimer.
- Audit log : filtres + recherche.

### 7. Exports & impression
- Export PDF via `jspdf` + `jspdf-autotable` (déjà fréquents).
- Export Excel via `xlsx` (SheetJS).
- Impression via `window.print()` avec styles print dédiés.
- Disponibles sur : Stock, Bons de sortie, Inventaire, Audit, Rapports.

### 8. Workflow demande utilisateur
Statuts : `en_attente → approuvee → preparation → disponible → livree → cloturee` (+ `rejetee`).
- Côté user : créer, suivre, confirmer réception (→ cloturee).
- Côté admin : valider/rejeter, passer en préparation, marquer disponible, livrer.

### 9. Vérifications finales
- `rg "@supabase"` dans `src/` → 0 résultat (hors fichier client mocké).
- Toutes les routes existantes répondent sans erreur runtime.
- Smoke test manuel via preview : login admin + user, navigation, CRUD stock, création demande, validation.

## Détails techniques
- Aucune migration SQL nouvelle (mode mock).
- Stockage : `localStorage` clé `stockflow_db_v2` (bump version pour reset propre).
- Dépendances ajoutées : `qrcode.react`, `jspdf`, `jspdf-autotable`, `xlsx` (si absentes).
- Dépendance retirée : `@supabase/supabase-js`.
- Conservation de l'alias Vite `@/integrations/supabase/client` pour ne pas casser les imports existants.

## Hors périmètre
- Pas de scan caméra réel si la lib pose problème (fallback input).
- Pas de refonte visuelle des pages existantes — uniquement câblage fonctionnel + ajouts ciblés (QR, expirations).
- Pas de tests automatisés ajoutés.