// authStorage.ts - single source of truth + migration from legacy session key
const TOKEN_KEY = "token";
const USER_KEY = "user";
const LEGACY_SESSION_KEY = "stockflow.local.session.v1";

type MaybeObj = Record<string, any> | null;

function readLegacySession(): MaybeObj {
  try {
    const raw = localStorage.getItem(LEGACY_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[AUTH] readLegacySession error', e);
    return null;
  }
}

function writeLegacySession(session: any) {
  try {
    const cur = readLegacySession() || {};
    const merged = { ...cur, ...session };
    localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('[AUTH] writeLegacySession error', e);
  }
}

export function getToken(): string | null {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) {
      console.log('[AUTH] token found: true (from token key)');
      return t;
    }
    // migrate from legacy session if present
    const legacy = readLegacySession();
    const candidate = legacy?.token || legacy?.access_token || legacy?.accessToken || null;
    if (candidate) {
      // migrate to canonical key
      localStorage.setItem(TOKEN_KEY, candidate);
      writeLegacySession({ ...legacy, token: candidate, access_token: candidate });
      console.log('[AUTH] token found: true (migrated from legacy session)');
      return candidate;
    }
    console.log('[AUTH] token found: false');
    return null;
  } catch (e) {
    console.error('[AUTH] getToken error', e);
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // keep legacy session in sync for any external code reading it
    const legacy = readLegacySession() || {};
    legacy.token = token;
    legacy.access_token = token;
    writeLegacySession(legacy);
  } catch (e) {
    console.error('[AUTH] setToken error', e);
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    const legacy = readLegacySession();
    if (legacy) {
      delete legacy.token;
      delete legacy.access_token;
      // if legacy is now empty, remove it entirely
      if (Object.keys(legacy).length === 0) {
        localStorage.removeItem(LEGACY_SESSION_KEY);
      } else {
        writeLegacySession(legacy);
      }
    }
  } catch (e) {
    console.error('[AUTH] removeToken error', e);
  }
}

export function getCurrentUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = readLegacySession();
    const user = legacy?.user || legacy?.currentUser || null;
    if (user) {
      // migrate
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      writeLegacySession({ ...legacy, user });
      return user;
    }
    return null;
  } catch (e) {
    console.error('[AUTH] getCurrentUser error', e);
    return null;
  }
}

export function setCurrentUser(user: any) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const legacy = readLegacySession() || {};
    legacy.user = user;
    writeLegacySession(legacy);
  } catch (e) {
    console.error('[AUTH] setCurrentUser error', e);
  }
}

export function removeCurrentUser() {
  try {
    localStorage.removeItem(USER_KEY);
    const legacy = readLegacySession();
    if (legacy) {
      delete legacy.user;
      // if legacy is now empty, remove it entirely
      if (Object.keys(legacy).length === 0) {
        localStorage.removeItem(LEGACY_SESSION_KEY);
      } else {
        writeLegacySession(legacy);
      }
    }
  } catch (e) {
    console.error('[AUTH] removeCurrentUser error', e);
  }
}

export function removeLegacySession() {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
    console.log('[AUTH] legacy session removed');
  } catch (e) {
    console.error('[AUTH] removeLegacySession error', e);
  }
}

export function clearAllAuth() {
  try {
    // Remove canonical keys
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Remove legacy session fully
    localStorage.removeItem(LEGACY_SESSION_KEY);

    // Remove any keys that look like old stockflow sessions to avoid ghosts
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('stockflow.')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // ignore iteration errors
    }

    // Clear sessionStorage entirely (app does not rely on sessionStorage for important persisted auth)
    try { sessionStorage.clear(); } catch (e) { /* ignore */ }

    console.log('[AUTH] cleared token, user, legacy session and stockflow.* keys');
  } catch (e) {
    console.error('[AUTH] clearAllAuth error', e);
  }
}
