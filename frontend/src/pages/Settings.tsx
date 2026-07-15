import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, ShieldCheck, Settings2 } from "lucide-react";
import { updatePasswordLocal, updateProfileLocal } from "@/services/localStoreAdapter";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", bio: "", language: "fr", timezone: "Africa/Casablanca", inventory_alerts: true, weekly_reports: false });
  const [pwd, setPwd] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, full_name: profile.full_name ?? "", bio: profile.bio ?? "", language: profile.language ?? "fr", timezone: profile.timezone ?? "Africa/Casablanca" }));
  }, [profile]);

  const save = async () => {
    updateProfileLocal(user!.id, { full_name: form.full_name, bio: form.bio, language: form.language, timezone: form.timezone });
    toast.success("Profil mis à jour");
    refreshProfile();
  };

  const updatePwd = async () => {
    if (pwd.next !== pwd.confirm) return toast.error("Les mots de passe ne correspondent pas");
    updatePasswordLocal(user!.id, pwd.next);
    toast.success("Mot de passe mis à jour");
    setPwd({ next: "", confirm: "" });
  };

  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Gérez vos préférences, sécurité et informations personnelles." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-soft">
          <h2 className="font-bold flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Informations du profil</h2>
          <div className="mt-6 flex items-center gap-4">
            <Avatar className="h-16 w-16"><AvatarImage src={profile?.avatar_url ?? undefined} /><AvatarFallback className="bg-gradient-primary text-primary-foreground">{initials}</AvatarFallback></Avatar>
            <div>
              <div className="font-semibold">Image d'avatar</div>
              <p className="text-xs text-muted-foreground">PNG ou JPG, max 5MB.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" className="bg-primary">Téléverser</Button>
                <Button size="sm" variant="outline">Retirer</Button>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Email"><Input value={profile?.email ?? ""} disabled /></Field>
          </div>
          <Field label="Bio professionnelle"><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="min-h-[100px]" /></Field>
          <div className="mt-6 flex justify-end"><Button onClick={save} className="bg-primary">Enregistrer</Button></div>
        </Card>

        <Card className="p-6 shadow-soft">
          <h2 className="font-bold">Préférences</h2>
          <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">Localisation</div>
          <Field label="Langue d'affichage">
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="fr">Français</option><option value="en">English (US)</option><option value="ar">العربية</option>
            </select>
          </Field>
          <Field label="Fuseau horaire">
            <Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} />
          </Field>
          <div className="mt-6 text-[11px] uppercase tracking-wider text-muted-foreground">Notifications</div>
          <Toggle label="Alertes d'inventaire" sub="Notifier quand le stock passe sous le seuil" checked={form.inventory_alerts} onChange={v => setForm({ ...form, inventory_alerts: v })} />
          <Toggle label="Rapports hebdomadaires" sub="Résumé de performance par email" checked={form.weekly_reports} onChange={v => setForm({ ...form, weekly_reports: v })} />
        </Card>
      </div>

      <Card className="mt-6 p-6 shadow-soft">
        <h2 className="font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Sécurité</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-semibold">Changer le mot de passe</h3>
            <p className="text-sm text-muted-foreground mt-1">Utilisez un mot de passe long et aléatoire pour rester en sécurité.</p>
            <div className="mt-4 space-y-3">
              <Field label="Nouveau mot de passe"><Input type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} placeholder="Min. 8 caractères" /></Field>
              <Field label="Confirmer le mot de passe"><Input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
              <Button onClick={updatePwd} className="bg-primary">Mettre à jour</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Authentification à deux facteurs</div>
            <p className="text-sm text-muted-foreground mt-2">Ajoutez une couche de sécurité supplémentaire en exigeant un code en plus du mot de passe.</p>
            <Button variant="link" className="mt-3 px-0 text-primary">Activer la 2FA →</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6 shadow-soft border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-destructive">Zone de danger</h3>
            <p className="text-sm text-muted-foreground">Une fois supprimé, votre compte ne peut pas être récupéré.</p>
          </div>
          <Button variant="destructive">Supprimer le compte</Button>
        </div>
      </Card>
    </>
  );
}
function Field({ label, children }: any) {
  return <div className="mt-3"><Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>;
}
function Toggle({ label, sub, checked, onChange }: any) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3">
      <div><div className="text-sm font-semibold">{label}</div><div className="text-xs text-muted-foreground">{sub}</div></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}