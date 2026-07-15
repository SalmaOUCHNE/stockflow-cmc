import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Check, X } from "lucide-react";
import logoCmc from "@/assets/logo-cmc.png";
import logoOfppt from "@/assets/logo-ofppt.png";
import warehouse from "@/assets/warehouse-hero.jpg";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/services/authStorage";
import { updatePasswordLocal } from "@/services/localStoreAdapter";

function checks(p: string) {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    digit: /\d/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p),
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  const c = useMemo(() => checks(pwd), [pwd]);
  const score = Object.values(c).filter(Boolean).length;
  const strong = score >= 4;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!strong) return setError("Le mot de passe ne respecte pas les critères de sécurité.");
    if (pwd !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    const current = getCurrentUser();
    const ok = current ? updatePasswordLocal(current.id, pwd) : true;
    setLoading(false);
    if (!ok) return setError("Utilisateur introuvable.");
    setDone(true);
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground bg-gradient-hero overflow-hidden">
        <img src={warehouse} alt="Entrepôt CMC" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-soft"><img src={logoCmc} alt="CMC" className="h-full w-full object-contain" /></div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-soft"><img src={logoOfppt} alt="OFPPT" className="h-full w-full object-contain" /></div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold">Nouveau mot de passe</h1>
          <p className="mt-4 text-lg text-white/85">Choisissez un mot de passe fort pour sécuriser votre accès.</p>
        </div>
        <div className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} OFPPT</div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-soft">
            {done ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="h-7 w-7 text-primary" /></div>
                <h2 className="text-2xl font-bold">Mot de passe mis à jour</h2>
                <p className="text-sm text-muted-foreground">Redirection vers la page de connexion…</p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold">Définir un mot de passe</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ready ? "Saisissez votre nouveau mot de passe." : "Validation du lien de réinitialisation…"}
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={pwd} onChange={(e) => setPwd(e.target.value)} type={show ? "text" : "password"} required minLength={8} className="pl-9 pr-9" />
                      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Confirmer le mot de passe</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? "text" : "password"} required minLength={8} className="pl-9" />
                    </div>
                  </div>

                  {pwd && (
                    <div className="space-y-2">
                      <div className="flex h-1.5 gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={cn("flex-1 rounded-full transition-colors",
                            i <= score
                              ? score >= 4 ? "bg-primary" : score >= 3 ? "bg-yellow-500" : "bg-destructive"
                              : "bg-secondary")} />
                        ))}
                      </div>
                      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <Req ok={c.length} label="8 caractères min." />
                        <Req ok={c.upper}  label="Une majuscule" />
                        <Req ok={c.lower}  label="Une minuscule" />
                        <Req ok={c.digit}  label="Un chiffre" />
                        <Req ok={c.symbol} label="Un symbole" />
                        <Req ok={!!confirm && pwd === confirm} label="Mots de passe identiques" />
                      </ul>
                    </div>
                  )}

                  {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

                  <Button type="submit" disabled={loading || !ready || !strong || pwd !== confirm} className="w-full h-11 bg-primary text-primary-foreground">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour…</> : "Mettre à jour le mot de passe"}
                  </Button>
                  <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="inline h-3 w-3 mr-1" /> Retour à la connexion
                  </Link>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-1.5", ok ? "text-primary" : "text-muted-foreground")}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{label}
    </li>
  );
}