// Adapter entre l'ancien mock/localStore et les services backend.
// Les fonctions prioritaires (auth, signup, profile, password, entries/exits)
// sont implémentées via l'API réelle. Les exports restants tombent encore
// sur le mock jusqu'à migration complète.

import api from "@/services/api";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

const resolveMediaUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  if (url.startsWith('/')) return `${apiOrigin}${url}`;
  return `${apiOrigin}/${url}`;
};

// Adapter mapping backend DTOs to frontend shapes

export const getProducts = async () => {
  const { data } = await api.get('/stock/products');
  return data.map((p: any) => ({
    id: p.id,
    name: p.libelle ?? p.name,
    reference: p.reference,
    sku: p.sku ?? p.reference,
    description: p.description,
    category_id: p.category_id ?? p.categoryId ?? null,
    category: p.category_name ?? p.category ?? null,
    quantity: p.stock_actuel ?? p.quantity ?? 0,
    min_threshold: p.seuil_alerte ?? p.min_threshold ?? 0,
    max_capacity: p.capacite_max ?? p.max_capacity ?? p.capacity ?? null,
    unit: p.unite_mesure ?? p.unit,
    location: p.emplacement ?? p.location ?? null,
    supplier: p.fournisseur ?? p.supplier ?? null,
    price: p.prix_unitaire ?? p.price ?? null,
    purchase_date: p.date_achat ?? p.purchase_date ?? null,
    expires_at: p.date_expiration ?? p.expires_at ?? null,
    image_url: resolveMediaUrl(p.photo_url ?? p.image_url ?? null),
    pole_id: p.pole_id ?? p.poleId ?? null,
    filiere_id: p.filiere_id ?? p.filiereId ?? null,
    raw: p,
  }));
};

export const getPoles = async () => {
  const { data } = await api.get('/stock/poles');
  return data.map((p: any) => ({ id: p.id, name: p.nom ?? p.name }));
};

export const getFilieres = async () => {
  const { data } = await api.get('/stock/filieres');
  return data.map((f: any) => ({ id: f.id, name: f.libelle ?? f.name, pole_id: f.pole_id ?? f.poleId }));
};

export const getRecentMovements = async () => {
  const { data } = await api.get('/stock/recent-movements');
  // Normalize movements
  return data.map((m: any) => ({
    id: m.id,
    product_id: m.product_id,
    type: m.type, // 'entree' or 'sortie'
    quantity: m.quantite ?? m.quantity,
    date: m.date_mouvement ?? m.created_at ?? m.date,
    user_id: m.user_id,
    product: m.product || null,
    raw: m,
  }));
};

export const listUsersWithRoles = async (opts?: any) => {
  const params = opts ?? {};
  const { data } = await api.get('/users', { params });
  return data.users ?? data;
};

const splitFullName = (full_name?: string) => {
  const parts = String(full_name ?? '').trim().split(/\s+/);
  return {
    prenom: parts[0] || '',
    nom: parts.slice(1).join(' ') || parts[0] || '',
  };
};

const normalizeUserPayload = (payload: any) => {
  const normalized = { ...payload };
  if (payload.full_name) {
    const { prenom, nom } = splitFullName(payload.full_name);
    normalized.prenom = prenom;
    normalized.nom = nom;
    delete normalized.full_name;
  }
  return normalized;
};

export const createUserLocal = async (payload: any) => {
  const normalizedPayload = normalizeUserPayload(payload);
  const { data } = await api.post('/users', normalizedPayload);
  return data;
};

export const updateUserLocal = async (id: string, payload: any) => {
  const normalizedPayload = normalizeUserPayload(payload);
  const { data } = await api.put(`/users/${id}`, normalizedPayload);
  return data;
};

export const approveUserLocal = async (id: string) => {
  const { data } = await api.patch(`/users/${id}/approve`);
  return data;
};

export const rejectUserLocal = async (id: string, reason?: string) => {
  const { data } = await api.patch(`/users/${id}/reject`, { reason });
  return data;
};

export const deleteUserLocal = async (id: string) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const markNotificationsRead = async (ids: string[] = []) => {
  await api.post('/notifications/mark-read', { ids });
};

export const getUnreadNotificationsCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data?.unreadCount ?? 0;
};

export const getNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data;
};

export const getItem = async (id: string) => {
  const products = await getProducts();
  return products.find((p: any) => String(p.id) === String(id)) || null;
};

const normalizeProductPayload = (item: any) => {
  const payload: any = {
    reference: item.reference,
    libelle: item.name,
    description: item.description,
    category_id: item.category_id ?? null,
    unite_mesure: item.unit,
    stock_actuel: item.quantity,
    seuil_alerte: item.min_threshold,
    photo_url: item.image_url,
    sku: item.sku,
    emplacement: item.location,
    fournisseur: item.supplier,
    prix_unitaire: item.price,
    date_achat: item.purchase_date,
    date_expiration: item.expires_at,
    capacite_max: item.max_capacity,
    pole_id: item.pole_id,
    filiere_id: item.filiere_id,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
      delete payload[key];
    }
  });

  return payload;
};

export const saveItemLocal = async (item: any) => {
  const payload = normalizeProductPayload(item);
  if (item.id) {
    const { data } = await api.put(`/stock/${item.id}`, payload);
    return data;
  } else {
    const { data } = await api.post('/stock', payload);
    return data;
  }
};

export const deleteItemLocal = async (id: string) => {
  const { data } = await api.delete(`/stock/${id}`);
  return data;
};

export const createStockEntryLocal = async (payload: any) => {
  const requestPayload = {
    ...payload,
    product_id: payload.product_id ?? payload.item_id,
  };
  delete requestPayload.item_id;
  const { data } = await api.post('/entries', requestPayload);
  await db.refresh();
  return data;
};

export const createStockExitLocal = async (payload: any) => {
  const requestPayload = {
    ...payload,
    product_id: payload.product_id ?? payload.item_id,
  };
  delete requestPayload.item_id;
  const { data } = await api.post('/exits', requestPayload);
  await db.refresh();
  return data;
};

export const getBons = async () => {
  const { data } = await api.get('/bons');
  return data;
};

export const getAuditLogs = async () => {
  const { data } = await api.get('/audit');
  return data;
};

// Categories endpoint wrapper (may be used by several pages)
export const getCategories = async () => {
  const { data } = await api.get('/categories');
  // Normalize to simple id/name
  return Array.isArray(data) ? data.map((c: any) => ({ id: c.id, name: c.libelle ?? c.name })) : [];
};

// Upload product photo helper
export const uploadProductPhoto = async (id: string, file: File, filename?: string) => {
  const formData = new FormData();
  formData.append('image', file, filename || file.name);
  const { data } = await api.post(`/stock/${id}/photo`, formData);
  await db.refresh();
  return data;
};

export const getInventorySessions = async () => {
  const { data } = await api.get('/inventory');
  return data;
};

export const getInventoryById = async (id: string) => {
  const { data } = await api.get(`/inventory/${id}`);
  const session = data.session ?? data;
  const lines = data.lines ?? data.inventory_lines ?? [];
  const items = data.items ?? {};
  return {
    ...session,
    inventory_lines: lines,
    items,
  };
};

export const signUpLocal = async (input: { full_name: string; email: string; password: string; fonction?: string }) => {
  try {
    await api.post('/auth/register', { full_name: input.full_name, email: input.email, password: input.password });
    return { user: null, error: null };
  } catch (e: any) {
    return { user: null, error: e?.response?.data?.error || e.message };
  }
};

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getProfile(userId: string | undefined | null) {
  if (!userId) return null;
  try {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  } catch {
    return null;
  }
}

export async function updateProfileLocal(userId: string, values: any) {
  try {
    const payload = normalizeUserPayload(values);
    const { data } = await api.put('/users/me', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export async function updatePasswordLocal(userId: string, password: any) {
  try {
    await api.put('/users/me/password', { currentPassword: password.currentPassword ?? password, newPassword: password.newPassword ?? password });
    return true;
  } catch (e) {
    return false;
  }
}

// Helper: synchronous lookup mapper used by legacy code
export const withLookups = (row: any) => {
  if (!row) return row;
  const item = db.items?.find((i: any) => String(i.id) === String(row.product_id || row.item_id || row.product?.id || row.product_id)) || null;
  const user = db.users?.find((u: any) => String(u.id) === String(row.user_id || row.requester_id)) || null;
  return {
    ...row,
    items: item ? { id: item.id, name: item.name, unit: item.unit, quantity: item.quantity } : (row.items || null),
    profile: user ? { id: user.id, full_name: `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() } : (row.profile || null),
  };
};

// Compatibility 'db' object used by legacy pages. Populated asynchronously on import.
export const db: any = {
  items: [],
  stock_entries: [],
  stock_exits: [],
  poles: [],
  filieres: [],
  notifications: [],
  users: [],
  bons: [],
  audit_log: [],
  inventory_sessions: [],
  inventory_lines: [],
  refresh: async () => {
    try {
      const [products, polesData, filieresData, movements, notifs, users, bonsData, auditLogs, inventories] = await Promise.all([
        getProducts().catch(() => []),
        getPoles().catch(() => []),
        getFilieres().catch(() => []),
        getRecentMovements().catch(() => []),
        getNotifications().catch(() => []),
        listUsersWithRoles().catch(() => []),
        getBons().catch(() => []),
        getAuditLogs().catch(() => []),
        getInventorySessions().catch(() => []),
      ]);
      db.items = products;
      db.poles = polesData;
      db.filieres = filieresData;
      db.stock_entries = movements.filter((m: any) => (m.type || '').toLowerCase().includes('entree'));
      db.stock_exits = movements.filter((m: any) => (m.type || '').toLowerCase().includes('sortie'));
      db.notifications = Array.isArray(notifs) ? notifs : (notifs.notifications || []);
      db.users = users;
      db.bons = bonsData;
      db.audit_log = auditLogs;
      db.inventory_sessions = Array.isArray(inventories) ? inventories : [];
      db.inventory_lines = [];
    } catch (e) {
      // ignore
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => void db.refresh());
  window.addEventListener('stockflow-auth', () => void db.refresh());
}

// Update stock exit status via bons endpoints
export const updateStockExitStatusLocal = async (id: string, status: string, payload: any = {}) => {
  try {
    if (status === 'validee') {
      await api.put(`/bons/${id}/validate`, payload);
    } else if (status === 'rejetee' || status === 'rejeté' || status === 'rejetee') {
      await api.put(`/bons/${id}/reject`, payload);
    } else if (status === 'livree' || status === 'livrée') {
      await api.put(`/bons/${id}/deliver`, payload);
    } else {
      // fallback: update via generic endpoint
      await api.put(`/bons/${id}`, payload).catch(() => null);
    }
    // refresh cache
    await db.refresh();
    return true;
  } catch (e) {
    console.error('Failed to update bon status', e);
    throw e;
  }
};

export const logAuditLocal = async (action: string, { entity_type, entity_id, old_value, new_value, metadata }: any = {}) => {
  try {
    await api.post('/audit', { action, entite_cible: entity_type, entite_id: entity_id, details: { old_value, new_value, metadata } });
  } catch (e) {
    console.error('audit log failed', e);
  }
};

export const createInventorySessionLocal = async (payload: any) => {
  const { data } = await api.post('/inventory', payload);
  await db.refresh();
  return data;
};

export const closeInventorySessionLocal = async (id: string) => {
  const { data } = await api.put(`/inventory/${id}/close`);
  await db.refresh();
  return data;
};

export const deleteInventorySessionLocal = async (id: string) => {
  const { data } = await api.delete(`/inventory/${id}`);
  await db.refresh();
  return data;
};

export const updateInventoryLineLocal = async (id: string, payload: any) => {
  const { data } = await api.put(`/inventory/line/${id}`, payload);
  await db.refresh();
  return data;
};

// Kick off initial refresh
void db.refresh();
