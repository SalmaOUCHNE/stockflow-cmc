import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, UserPlus, Info, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { setCurrentUser, setToken } from "@/services/authStorage";
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
    const isAdmin = roles.some((role) => role?.toString().toLowerCase() === "admin");
    if (user) navigate(isAdmin ? "/dashboard" : "/portal/dashboard");
  }, [user, roles, navigate]);

 const doLogin = async (mail: string, pwd: string) => {
  try {
    setLoading(true);
    setError(null);

    console.log('[LOGIN] attempting login for:', mail);
    const { data } = await api.post('/auth/login', { email: mail, password: pwd });

    if (!data || !data.token) {
      throw new Error(data?.error || 'Réponse invalide du serveur');
    }

    console.log('[LOGIN] received token and user:', { tokenPresent: !!data.token, userId: data.user?.id, role: data.user?.role });
    setToken(data.token);
    setCurrentUser(data.user);

    console.log('[LOGIN] stored auth data, dispatching stockflow-auth');
    window.dispatchEvent(new Event('stockflow-auth'));

    const userRole = data.user?.role?.toString().toLowerCase();
    console.log('[LOGIN] user role:', userRole, '-> navigating to', userRole === 'admin' ? '/dashboard' : '/portal/dashboard');
     
    if (userRole === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/portal/dashboard');
    }

  } catch (err: any) {
    const errorMsg = err?.response?.data?.error || err?.message || 'Erreur de connexion';
    console.error('[LOGIN] error:', errorMsg);
    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};
 

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doLogin(email, password); };
  const quickAdmin = () => { setEmail("admin@cmc.ma"); setPassword("AdminPass123!"); doLogin("admin@cmc.ma", "AdminPass123!"); };
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
      className="
        relative z-10
        h-20 w-auto object-contain
        hover:scale-110
        transition-all duration-500
        drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]
      "
    />
  </div>

  <div className="group relative">
    <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
    <img
      src={logoOfppt}
      alt="OFPPT"
      className="
        relative z-10
        h-20 w-auto object-contain
        hover:scale-110
        transition-all duration-500
        drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]
      "
    />
  </div>
</div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold">StockFlow CMC</h1>
          <p className="mt-4 text-lg text-white/85">
            Système de gestion de stock pour CMC Casablanca-Settat.
          </p>
          <p className="mt-2 text-sm text-white/70">
            Suivi des entrées, sorties et inventaires par pôle métier.
          </p>
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
                  <span className="text-[10px] text-muted-foreground font-normal">admin@cmc.ma / AdminPass1</span>
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
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
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