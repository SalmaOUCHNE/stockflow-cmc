import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import logoCmc from "@/assets/logo-cmc.png";
import logoOfppt from "@/assets/logo-ofppt.png";
import warehouse from "@/assets/warehouse-hero.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const error = null;
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
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
          <h1 className="text-5xl font-extrabold">Mot de passe oublié</h1>
          <p className="mt-4 text-lg text-white/85">Réinitialisez votre accès à StockFlow CMC en toute sécurité.</p>
        </div>
        <div className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} OFPPT</div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-soft">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Email envoyé</h2>
                <p className="text-sm text-muted-foreground">
                  Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien
                  de réinitialisation dans quelques instants. Vérifiez également vos spams.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion</Link>
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold">Réinitialisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Adresse email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="nom@cmc-casablanca.ma" className="pl-9" />
                    </div>
                  </div>
                  {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…</> : "Envoyer le lien"}
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