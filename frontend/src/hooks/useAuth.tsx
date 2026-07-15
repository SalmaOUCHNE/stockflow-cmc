import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/services/api";
import {
  clearAllAuth,
  getCurrentUser,
  getToken,
  removeCurrentUser,
  removeToken,
  setCurrentUser,
} from "@/services/authStorage";

type LocalUser = { id?: number | string; nom?: string; prenom?: string; email?: string; role?: string };
type LocalSession = any;
type LocalProfile = any;

interface AuthCtx {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  roles: string[];
  profile: LocalProfile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role?: string) => {
    if (!role) return undefined;
    return role.toString().toLowerCase();
  };

  const hydrate = async () => {
    const token = getToken();
    console.log('[USEAUTH] hydrate start, token present:', !!token);

    if (!token) {
      setUser(null);
      setSession(null);
      setRoles([]);
      setProfile(null);
      setLoading(false);
      console.log('[USEAUTH] hydrate: no token available');
      return;
    }

    const cachedUser = getCurrentUser();
    if (cachedUser) {
      console.log('[USEAUTH] hydrate: loaded cached user from authStorage', { id: cachedUser?.id, role: cachedUser?.role });
      setUser(cachedUser);
      setProfile(cachedUser);
      setRoles([normalizeRole(cachedUser?.role)].filter(Boolean));
    }

    try {
      console.log('[USEAUTH] hydrate: calling GET /users/me with token');
      const { data } = await api.get('/users/me');
      console.log('[USEAUTH] hydrate success: user =', data?.email, 'role =', data?.role);
      setUser(data);
      setProfile(data);
      setRoles([normalizeRole(data?.role)].filter(Boolean));
      setCurrentUser(data);
      setLoading(false);
    } catch (e: any) {
      const status = e?.response?.status;
      const isNetworkError = !e?.response; // No response means network error
      const is401 = status === 401;
      const is403 = status === 403;

      console.error('[USEAUTH] hydrate error - status:', status, 'networkError:', isNetworkError, 'message:', e?.message);

      if (is401 || is403) {
        console.log('[USEAUTH] hydrate: token invalid (401/403), clearing auth storage');
        removeToken();
        removeCurrentUser();
        setUser(null);
        setRoles([]);
        setProfile(null);
      } else if (isNetworkError) {
        console.log('[USEAUTH] hydrate: network error, preserving token for retry');
      } else {
        console.log('[USEAUTH] hydrate: unexpected error, keeping token for retry');
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    void hydrate();
    const onStorage = () => {
      void hydrate();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("stockflow-auth", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("stockflow-auth", onStorage);
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[USEAUTH] signOut called');
      clearAllAuth();
      setUser(null);
      setRoles([]);
      setProfile(null);
      setSession(null);
      // notify other listeners in this tab
      try { window.dispatchEvent(new Event("stockflow-auth")); } catch (e) { console.warn('dispatch stockflow-auth failed', e); }
      // navigate to login to ensure UI reflects logged-out state
      try { window.location.replace('/login'); } catch (e) { console.warn('navigation to /login failed', e); }
    } catch (e) {
      console.error('[USEAUTH] signOut error', e);
    }
  };

  const refreshProfile = async () => {
    try {
      console.log('[USEAUTH] refreshProfile: calling GET /users/me');
      const { data } = await api.get('/users/me');
      console.log('[USEAUTH] refreshProfile success');
      setUser(data);
      setProfile(data);
      setRoles([normalizeRole(data?.role)].filter(Boolean));
      setCurrentUser(data);
    } catch (e: any) {
      const status = e?.response?.status;
      console.error('[USEAUTH] refreshProfile error - status:', status);
      if (status === 401 || status === 403) {
        console.log('[USEAUTH] refreshProfile: token invalid, clearing auth storage');
        removeToken();
        removeCurrentUser();
        setUser(null);
        setRoles([]);
        setProfile(null);
      }
    }
  };

  return <Ctx.Provider value={{ user, session, loading, roles, profile, signOut, refreshProfile }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
