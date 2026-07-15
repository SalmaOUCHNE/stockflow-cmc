import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Mail, Briefcase, MapPin, Save, Shield, Bell, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PortalProfil() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [fonction, setFonction] = useState(profile?.fonction ?? "");
  const roleLabel = profile?.role ? String(profile.role) : "Utilisateur";
  const initials = (name || profile?.prenom || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Mon profil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-6 shadow-soft text-center">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/10">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="mt-4 text-lg font-bold">{name || profile?.full_name || profile?.email || "Utilisateur"}</div>
          <div className="text-sm text-muted-foreground">{fonction || profile?.fonction || "Fonction non renseignée"}</div>
          <Badge variant="outline" className="mt-3 border-success/30 text-success">Compte actif</Badge>

          <div className="mt-6 space-y-3 text-left text-sm">
            <Row icon={Mail} label="Email" value={email || profile?.email || '—'} />
            <Row icon={Briefcase} label="Fonction" value={fonction || profile?.fonction || '—'} />
            <Row icon={MapPin} label="Site" value="CMC Casablanca-Settat" />
            <Row icon={Shield} label="Rôle" value={roleLabel} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Informations personnelles</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Email professionnel"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
              <Field label="Fonction"><Input value={fonction} onChange={(e) => setFonction(e.target.value)} /></Field>
              <Field label="Téléphone"><Input placeholder="+212 6 00 00 00 00" /></Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button className="bg-gradient-primary text-primary-foreground" onClick={() => toast.success("Profil mis à jour") }>
                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
              </Button>
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Préférences</h3>
            <div className="space-y-3">
              <Toggle label="Recevoir les notifications par email" defaultChecked />
              <Toggle label="Notifications de validations et rejets" defaultChecked />
              <Toggle label="Alertes de stock et disponibilité" />
              <Toggle label="Récapitulatif hebdomadaire" defaultChecked />
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Langue et région</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Langue"><Input defaultValue="Français" readOnly /></Field>
              <Field label="Fuseau horaire"><Input defaultValue="Africa/Casablanca" readOnly /></Field>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
function Field({ label, children }: any) {
  return (<div><Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>);
}
function Toggle({ label, defaultChecked }: any) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="text-sm">{label}</div>
      <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
