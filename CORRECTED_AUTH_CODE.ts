/* 
  ============================================================================
  FRONTEND - CORRECTED AUTHENTICATION FILES
  ============================================================================
*/

/* 
  FILE 1: frontend/src/pages/Login.tsx
  ============================================================================
*/
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, UserPlus, Info, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import warehouse from "@/assets/warehouse-hero.jpg";
import logoCmc from "@/assets/logo-cmc.png";
import logoOfppt from "@/assets/logo-ofppt.png";

export default function Login() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect if user is already authenticated (loaded from hydration)
    // This prevents redirecting before auth context is populated
    console.log('[LOGIN] useEffect - user check:', { userExists: !!user, hasRoles: roles.length > 0 });
    
    if (user && roles.length > 0) {
      const isAdmin = roles.some((role) => role?.toString().toLowerCase() === "admin");
      console.log('[LOGIN] useEffect - redirecting authenticated user, isAdmin:', isAdmin);
      navigate(isAdmin ? "/dashboard" : "/portal/dashboard");
    }
  }, [user, roles, navigate]);

  const doLogin = async (mail: string, pwd: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[LOGIN] attempting login for:', mail);
      const { data } = await api.post('/auth/login', { email: mail, password: pwd });

      // VALIDATE RESPONSE BEFORE SAVING
      console.log('[LOGIN] response received:', { 
        hasData: !!data,
        hasToken: !!(data?.token),
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userRole: data?.user?.role
      });

      if (!data || !data.token || !data.user) {
        throw new Error(data?.error || 'Réponse invalide du serveur (token ou user manquant)');
      }

      const userRole = data.user?.role?.toString().toLowerCase();
      console.log('[LOGIN] validation passed, saving to localStorage');

      // SAVE TOKEN AND USER TO LOCALSTORAGE
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('[LOGIN] saved token and user, dispatching stockflow-auth event');

      // DISPATCH EVENT TO TRIGGER AUTH CONTEXT HYDRATION
      window.dispatchEvent(new Event('stockflow-auth'));

      // WAIT FOR HYDRATION THEN NAVIGATE
      setTimeout(() => {
        console.log('[LOGIN] navigating to dashboard for role:', userRole);
        navigate(
          userRole === "admin" 
            ? "/dashboard" 
            : "/portal/dashboard"
        );
      }, 100);

    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Erreur de connexion';
      console.error('[LOGIN] error:', { message: errorMsg, status: err?.response?.status, error: err });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doLogin(email, password); };
  const quickAdmin = () => { setEmail("admin@cmc.ma"); setPassword("admin123"); doLogin("admin@cmc.ma", "admin123"); };
  const quickUser  = () => { setEmail("user@cmc.ma");  setPassword("user123");  doLogin("user@cmc.ma",  "user123");  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground bg-gradient-hero overflow-hidden">
        <img src={warehouse} alt="Entrepôt CMC" className="absolute inset-0 h-full w-full object-cover opacity-25" width={1280} height={1280} />
        <div className="relative z-10">
          <div className="flex items-start justify-between w-full">
            <div className="group relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <img
                src={logoCmc}
                alt="CMC"
                className="relative z-10 h-20 w-auto object-contain hover:scale-110 transition-all duration-500 drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              />
            </div>
            <div className="group relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <img
                src={logoOfppt}
                alt="OFPPT"
                className="relative z-10 h-20 w-auto object-contain hover:scale-110 transition-all duration-500 drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold">StockFlow CMC</h1>
          <p className="mt-4 text-lg text-white/85">Système de gestion de stock pour CMC Casablanca-Settat.</p>
          <p className="mt-2 text-sm text-white/70">Suivi des entrées, sorties et inventaires par pôle métier.</p>
        </div>
        <div className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} OFPPT — Cités des Métiers et des Compétences</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center justify-center gap-3">
            <img src={logoCmc} alt="CMC" className="h-12 w-12 object-contain" />
            <img src={logoOfppt} alt="OFPPT" className="h-12 w-12 object-contain" />
          </div>
          <div className="rounded-2xl bg-card border border-border p-8 shadow-soft">
            <h2 className="text-3xl font-bold">Connexion</h2>
            <p className="mt-1 text-sm text-muted-foreground">Accédez à votre tableau de bord d'inventaire</p>

            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-primary mb-2">
                <Info className="h-4 w-4 shrink-0" /> Comptes de démonstration
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" onClick={quickAdmin} disabled={loading} variant="outline" className="h-auto py-2 flex-col items-start gap-0.5 border-primary/40 hover:bg-primary/10">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-primary"><Shield className="h-3 w-3" /> Connexion Admin</span>
                  <span className="text-[10px] text-muted-foreground font-normal">admin@cmc.ma / admin123</span>
                </Button>
                <Button type="button" onClick={quickUser} disabled={loading} variant="outline" className="h-auto py-2 flex-col items-start gap-0.5 border-accent/40 hover:bg-accent/10">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-accent"><UserIcon className="h-3 w-3" /> Connexion Utilisateur</span>
                  <span className="text-[10px] text-muted-foreground font-normal">user@cmc.ma / user123</span>
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Adresse email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="nom@cmc-casablanca.ma" required className="pl-9" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Mot de passe oublié ?</Link>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="••••••••" required minLength={6} className="pl-9 pr-9" />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Checkbox id="remember" defaultChecked />
                <label htmlFor="remember" className="text-muted-foreground">Se souvenir de moi</label>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:opacity-95 h-11 text-base">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion…</> : <>Se connecter <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Nouvel utilisateur ?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                <UserPlus className="h-3.5 w-3.5" /> Créer un compte
              </Link>
            </div>

            <div className="mt-6 border-t border-border pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Accès réservé au personnel autorisé
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* 
  FILE 2: frontend/src/hooks/useAuth.tsx
  ============================================================================
*/
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/services/api";

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
    console.log('[HYDRATE] Starting hydration...');
    
    const token = localStorage.getItem("token");
    console.log('[HYDRATE] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

    if (!token) {
      console.log('[HYDRATE] No token found, checking for cached user data');
      const cachedUser = localStorage.getItem("user");
      
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.log('[HYDRATE] Found cached user:', userData?.email);
          setUser(userData);
          setProfile(userData);
          setRoles([normalizeRole(userData?.role)].filter(Boolean));
        } catch (e) {
          console.error('[HYDRATE] Failed to parse cached user:', e);
          localStorage.removeItem("user");
        }
      } else {
        console.log('[HYDRATE] No cached user, user is logged out');
        setUser(null);
        setRoles([]);
        setProfile(null);
      }
      
      setLoading(false);
      return;
    }

    try {
      console.log('[HYDRATE] Token found, validating with GET /users/me');
      const { data } = await api.get('/users/me');
      
      console.log('[HYDRATE] ✓ /users/me succeeded:', {
        userId: data?.id,
        email: data?.email,
        role: data?.role
      });

      setUser(data);
      setProfile(data);
      setRoles([normalizeRole(data?.role)].filter(Boolean));
      localStorage.setItem('user', JSON.stringify(data));
      
    } catch (e: any) {
      const status = e?.response?.status;
      const isNetworkError = !e?.response;
      const is401 = status === 401;
      const is403 = status === 403;

      console.error('[HYDRATE] ✗ /users/me failed', {
        status,
        isNetworkError,
        is401,
        is403,
        message: e?.message,
        errorData: e?.response?.data
      });

      if (is401 || is403) {
        console.log('[HYDRATE] Token is invalid (401/403), clearing');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setRoles([]);
        setProfile(null);
      } else if (isNetworkError) {
        console.log('[HYDRATE] Network error, keeping token for retry');
      } else {
        console.log('[HYDRATE] Server error (5xx), keeping token for retry');
      }
      
    } finally {
      console.log('[HYDRATE] Hydration complete, loading = false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[USEAUTH] Initial mount, calling hydrate');
    void hydrate();
    
    const onStorageChange = () => {
      console.log('[USEAUTH] Storage or stockflow-auth event triggered, calling hydrate');
      void hydrate();
    };
    
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("stockflow-auth", onStorageChange);
    
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("stockflow-auth", onStorageChange);
    };
  }, []);

  const signOut = async () => {
    console.log('[USEAUTH] signOut called');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setRoles([]);
    setProfile(null);
    setSession(null);
    window.dispatchEvent(new Event("stockflow-auth"));
  };

  const refreshProfile = async () => {
    try {
      console.log('[USEAUTH] refreshProfile: calling GET /users/me');
      const { data } = await api.get('/users/me');
      console.log('[USEAUTH] refreshProfile ✓ success:', data?.email);
      setUser(data);
      setProfile(data);
      setRoles([normalizeRole(data?.role)].filter(Boolean));
      localStorage.setItem('user', JSON.stringify(data));
    } catch (e: any) {
      const status = e?.response?.status;
      console.error('[USEAUTH] refreshProfile ✗ error - status:', status, 'message:', e?.message);
      
      if (status === 401 || status === 403) {
        console.log('[USEAUTH] refreshProfile: token invalid, clearing');
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


/* 
  FILE 3: frontend/src/services/api.ts
  ============================================================================
*/
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const method = config.method?.toUpperCase() || "GET";
  const url = config.url || "";

  console.log(`[AXIOS] ${method} ${url} - token present: ${!!token}`);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[AXIOS] Added Authorization header: Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log(`[AXIOS] No token found in localStorage, request will be unauthenticated`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase() || "GET";
    const url = response.config.url || "";
    const status = response.status;
    console.log(`[AXIOS] ✓ ${method} ${url} - status: ${status}`);
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const method = error?.config?.method?.toUpperCase() || "GET";
    const url = error?.config?.url || "";
    
    console.error(`[AXIOS] ✗ ${method} ${url} - status: ${status || "no response"}`, {
      message: error?.message,
      statusCode: status,
      responseData: error?.response?.data
    });

    if (status === 401) {
      console.log(`[AXIOS] 401 Unauthorized - clearing token and user from localStorage`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("stockflow-auth"));
    }
    
    return Promise.reject(error);
  }
);

export default api;


/* 
  FILE 4: frontend/src/components/app/ProtectedRoute.tsx
  ============================================================================
*/
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function ProtectedRoute({ 
  children, 
  adminOnly, 
  nonAdminOnly 
}: { 
  children: ReactNode; 
  adminOnly?: boolean; 
  nonAdminOnly?: boolean 
}) {
  const { user, loading, roles } = useAuth();
  const token = localStorage.getItem("token");
  const isAdmin = roles.some((role) => role?.toString().toLowerCase() === "admin");

  console.log('[PROTECTED_ROUTE]', {
    loading,
    userExists: !!user,
    userEmail: user?.email,
    tokenExists: !!token,
    roles,
    isAdmin,
    adminOnly,
    nonAdminOnly
  });

  if (loading) {
    console.log('[PROTECTED_ROUTE] Still loading, showing spinner');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user && !token) {
    console.log('[PROTECTED_ROUTE] No user and no token, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('[PROTECTED_ROUTE] Admin-only route, user is not admin, redirecting to /portal/dashboard');
    return <Navigate to="/portal/dashboard" replace />;
  }

  if (nonAdminOnly && isAdmin) {
    console.log('[PROTECTED_ROUTE] Non-admin-only route, user IS admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[PROTECTED_ROUTE] ✓ Access granted');
  return <>{children}</>;
}
