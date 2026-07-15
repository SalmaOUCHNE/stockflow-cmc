import { useEffect, useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getNotifications, markNotificationsRead } from "@/services/localStoreAdapter";

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : (data.notifications || data);
      const filtered = list
        .filter((n: any) => n.user_id === user?.id || n.user_id == null)
        .sort((a: any, b: any) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, 15);
      setItems(filtered);
    } catch (error) {
      console.error('Failed to load notification bell data', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void load();
    const interval = setInterval(() => {
      void load();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unread = items.filter((n) => !n.is_read).length;

  const markAll = async () => {
    try {
      await markNotificationsRead([]);
      await load();
    } catch (error) {
      console.error('Failed to mark notifications read', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-scale-in">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div>
            <div className="font-semibold text-sm">Notifications</div>
            <div className="text-xs text-muted-foreground">{loading ? 'Chargement...' : `${unread} non lue${unread > 1 ? 's' : ''}`}</div>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="h-8">
              <Check className="mr-1 h-3 w-3" /> Tout marquer
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-10 flex flex-col items-center text-center text-muted-foreground">Chargement des notifications…</div>
          ) : items.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center text-muted-foreground">
              <Inbox className="h-7 w-7 opacity-60" />
              <div className="mt-2 text-sm">Aucune notification</div>
            </div>
          ) : (
            items.map((n) => (
              <Link key={n.id} to={n.link ?? "/notifications"} className={`block px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                <div className="flex gap-4">
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{n.title ?? n.type ?? 'Notification'}</div>
                    {n.message && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr }) : '—'}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
