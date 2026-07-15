import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, Hourglass, CheckCircle2, XCircle, BookOpen, Plus, Bell, CheckCheck, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getBons, getNotifications } from "@/services/localStoreAdapter";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    validee:    "bg-success/10 text-success border-success/30",
    en_attente: "bg-warning/10 text-warning border-warning/30",
    emis:       "bg-warning/10 text-warning border-warning/30",
    rejetee:    "bg-destructive/10 text-destructive border-destructive/30",
    livree:     "bg-primary/10 text-primary border-primary/30",
  };
  return map[s] ?? "bg-secondary text-muted-foreground";
};

export default function PortalDashboard() {
  const { profile } = useAuth();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const first = (profile?.full_name ?? `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`).split(" ")[0] || "Utilisateur";

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [bons, notifs] = await Promise.all([getBons(), getNotifications()]);
        if (!active) return;
        setDemandes((Array.isArray(bons) ? bons : []).filter((b) => String(b.demandeur_id) === String(profile?.id)));
        setNotifications(Array.isArray(notifs) ? notifs.slice(0, 3) : []);
      } catch (error) {
        console.error('Failed to load portal dashboard data', error);
        if (active) {
          setDemandes([]);
          setNotifications([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (profile?.id) {
      void loadData();
    } else {
      setDemandes([]);
      setNotifications([]);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [profile?.id]);

  const total = demandes.length;
  const counts = {
    total,
    en_attente: demandes.filter((d) => d.status === "en_attente" || d.status === "emis").length,
    validee: demandes.filter((d) => d.status === "validee").length,
    rejetee: demandes.filter((d) => d.status === "rejetee").length,
    livree: demandes.filter((d) => d.status === "livree").length,
  };

  const myDemandes = demandes.slice(0, 4).map((d) => ({
    id: d.id,
    article: d.items?.name ?? "Article inconnu",
    qte: d.quantity ?? d.quantite ?? 0,
    date: d.exit_date ? new Date(d.exit_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    statut: d.status === "validee" ? "Validée" : d.status === "rejetee" ? "Rejetée" : d.status === "livree" ? "Livrée" : "En attente",
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Bonjour, {first} </h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez le catalogue et suivez vos demandes de matériel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Demandes envoyées" value={String(counts.total)} sub="Total des demandes" icon={Send} tone="primary" />
        <StatCard label="En attente" value={String(counts.en_attente)} sub="En attente de validation" icon={Hourglass} tone="warning" />
        <StatCard label="Validées" value={String(counts.validee)} sub="Matériel prêt" icon={CheckCircle2} tone="success" />
        <StatCard label="Rejetées" value={String(counts.rejetee)} sub="Demandes rejetées" icon={XCircle} tone="destructive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Mes dernières demandes</h3>
            <Link to="/portal/mes-demandes" className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="pb-3">Article</th><th className="pb-3">Qté</th><th className="pb-3">Date</th><th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myDemandes.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 flex items-center gap-3 font-medium">
                    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    {d.article}
                  </td>
                  <td className="py-3 font-mono">{String(d.qte).padStart(2, "0")}</td>
                  <td className="py-3 text-muted-foreground">{d.date}</td>
                  <td className="py-3"><Badge variant="outline" className={statusBadge(d.statut)}>{d.statut}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            <Link to="/portal/notifications" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">Aucune notification récente.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-secondary"><Bell className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{n.type ? String(n.type).replace(/_/g, ' ') : 'Notification'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message ?? "Aucune description disponible."}</div>
                    <div className="text-[10px] text-muted-foreground/80 mt-1 uppercase tracking-wider">{n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 shadow-elegant relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Besoin de matériel ?</h3>
            <p className="text-sm text-white/80 mt-1 max-w-lg">
              Explorez notre inventaire complet et effectuez une demande en quelques clics pour vos besoins professionnels.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/95">
            <Link to="/portal/catalogue"><BookOpen className="mr-2 h-4 w-4" /> Parcourir le catalogue</Link>
          </Button>
        </div>
      </Card>
    </>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone }: any) {
  const tones: Record<string, string> = {
    primary:     "border-l-primary text-primary",
    warning:     "border-l-warning text-warning",
    success:     "border-l-success text-success",
    destructive: "border-l-destructive text-destructive",
  };
  return (
    <Card className={`p-5 shadow-soft border-l-4 ${tones[tone]?.split(" ")[0]}`}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <Icon className={`h-4 w-4 ${tones[tone]?.split(" ")[1]}`} />
      </div>
      <div className="mt-2 text-3xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}