import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { getNotifications, markNotificationsRead } from "@/services/localStoreAdapter";

type Tab = "toutes" | "non_lues" | "validations" | "rejets" | "livraisons" | "alertes";

type NotificationItem = {
  id: string | number;
  type?: string;
  message?: string;
  is_read?: boolean;
  lien_action?: string;
  created_at?: string;
};

export default function PortalNotifications() {
  const [tab, setTab] = useState<Tab>("toutes");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Unable to load notifications', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const filtered = items.filter((n) => {
    if (tab === "toutes") return true;
    if (tab === "non_lues") return !n.is_read;
    return n.type === tab;
  });

  const markAll = async () => {
    try {
      const ids = items.filter((n) => !n.is_read).map((n) => String(n.id));
      await markNotificationsRead(ids);
      await loadNotifications();
    } catch (error) {
      console.error('Unable to mark notifications as read', error);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Restez informé de l'état de vos demandes de matériel.</p>
        </div>
        <Button onClick={markAll} className="bg-gradient-primary text-primary-foreground"><CheckCheck className="mr-2 h-4 w-4" /> Tout marquer comme lu</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { k: "toutes", l: "Toutes" },
          { k: "non_lues", l: "Non lues" },
          { k: "validations", l: "Validations" },
          { k: "rejets", l: "Rejets" },
          { k: "livraisons", l: "Livraisons" },
          { k: "alertes", l: "Alertes" },
        ] as { k: Tab; l: string }[]).map((t) => (
          <Button
            key={t.k}
            variant={tab === t.k ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.k)}
            className={tab === t.k ? "bg-primary text-primary-foreground" : ""}
          >
            {t.l}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center text-muted-foreground">Chargement des notifications…</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Aucune notification dans cette catégorie.</Card>
        ) : (
          filtered.map((n) => (
            <Card key={n.id} className={`p-5 shadow-soft transition-all hover:shadow-elegant ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{n.type ? String(n.type).replace(/_/g, ' ') : 'Notification'}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : '—'}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message ?? "Aucune description disponible."}</p>
                {n.lien_action && (
                  <a href={n.lien_action} className="text-sm font-medium text-primary hover:underline">Voir le détail</a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
