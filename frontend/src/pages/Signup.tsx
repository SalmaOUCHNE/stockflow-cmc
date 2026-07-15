import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import warehouse from "@/assets/warehouse-hero.jpg";
import logoCmc from "@/assets/logo-cmc.png";
import logoOfppt from "@/assets/logo-ofppt.png";
import { signUpLocal } from "@/services/localStoreAdapter";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", fonction: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await signUpLocal(form);
    setLoading(false);
    if (error) { setError(error); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground bg-gradient-hero overflow-hidden">
        <img src={warehouse} alt="Entrepôt CMC" className="absolute inset-0 h-full w-full object-cover opacity-25" />
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
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold">Rejoindre StockFlow</h1>
          <p className="mt-4 text-lg text-white/85">
            Demandez l'accès à la plateforme de gestion de stock de la CMC Casablanca-Settat.
          </p>
          <p className="mt-2 text-sm text-white/70">
            Votre compte sera activé après validation par le Responsable Magasin.
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} OFPPT</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-soft">
            {done ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold">Demande envoyée</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Votre compte <strong>{form.email}</strong> a bien été créé.<br />
                  Le Responsable Magasin doit approuver votre accès avant votre première connexion.
                </p>
                <Button asChild className="mt-6 bg-primary"><Link to="/login">Retour à la connexion</Link></Button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold">Créer un compte</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Renseignez vos informations. Un Responsable Magasin validera votre demande.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nom complet</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="Prénom Nom" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email professionnel</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="nom@cmc-casablanca.ma" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fonction</Label>
                    <div className="relative mt-1">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.fonction} onChange={e => setForm({ ...form, fonction: e.target.value })} required placeholder="ex. Formateur Maintenance, Magasinier…" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="8 caractères minimum" className="pl-9" />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full bg-primary h-11 text-base">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…</> : <>Envoyer ma demande <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>

                <div className="mt-6 border-t border-border pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Votre compte sera approuvé par un Responsable Magasin
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Déjà un compte ? <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}