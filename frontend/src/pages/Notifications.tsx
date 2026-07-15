import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Inbox, AlertTriangle, Calendar, FileCheck2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getNotifications, markNotificationsRead } from "@/services/localStoreAdapter";

const ICONS: Record<string, any> = {
  low_stock: AlertTriangle,
  expiry: Calendar,
  exit_request: FileCheck2,
};
const TONES: Record<string, string> = {
  low_stock: "text-warning bg-warning/10",
  expiry: "text-destructive bg-destructive/10",
  exit_request: "text-primary bg-primary/10",
};

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : (data.notifications || data);
      const filtered = list
        .filter((n: any) => n.user_id === user?.id || n.user_id == null)
        .sort((a: any, b: any) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      setItems(filtered);
    } catch (e) {
      console.error('Failed to load notifications', e);
      setItems([]);
    }
  };
  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visible = filter === "unread" ? items.filter((i) => !i.is_read) : items;
  const unread = items.filter((i) => !i.is_read).length;

  const markAll = async () => {
    await markNotificationsRead([]);
    await load();
  };
  const markOne = async (id: string) => {
    await markNotificationsRead([id]);
    await load();
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Centre de notifications : alertes stock, expirations et demandes de sortie."
        actions={
          <Button variant="outline" disabled={unread === 0} onClick={markAll}>
            <Check className="mr-2 h-4 w-4" /> Tout marquer comme lu
          </Button>
        }
      />
      <div className="mb-4 flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          Toutes ({items.length})
        </Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
          Non lues ({unread})
        </Button>
      </div>
      <Card className="shadow-soft overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-50" />
            <div className="mt-3 font-medium">Aucune notification</div>
            <div className="text-xs mt-1">Vous serez averti des alertes stock, expirations et demandes.</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const tone = TONES[n.type] ?? "text-muted-foreground bg-muted";
              return (
                <div key={n.id} className={`flex gap-4 p-5 hover:bg-secondary/30 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{n.title}</div>
                      {!n.is_read && <Badge variant="outline" className="border-primary/40 text-primary text-[10px] h-5">Nouveau</Badge>}
                    </div>
                    {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                      <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</span>
                      {n.link && <Link to={n.link} className="text-primary hover:underline normal-case tracking-normal">Ouvrir →</Link>}
                    </div>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markOne(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}