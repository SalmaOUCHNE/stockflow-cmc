import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Inbox, ArrowLeft, ArrowRight } from "lucide-react";
import { getAuditLogs, listUsersWithRoles } from "@/services/localStoreAdapter";
import { db } from "@/services/localStoreAdapter";

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  "auth.login": { label: "Connexion", tone: "border-primary/40 text-primary" },
  "auth.logout": { label: "Déconnexion", tone: "" },
  "item.create": { label: "Création article", tone: "border-success/40 text-success" },
  "item.update": { label: "Modification article", tone: "border-warning/40 text-warning" },
  "item.archive": { label: "Archivage article", tone: "border-muted-foreground/40 text-muted-foreground" },
  "entry.create": { label: "Entrée stock", tone: "border-success/40 text-success" },
  "exit.create": { label: "Sortie stock", tone: "border-destructive/40 text-destructive" },
  "exit.validate": { label: "Sortie validée", tone: "border-success/40 text-success" },
  "exit.reject": { label: "Sortie rejetée", tone: "border-destructive/40 text-destructive" },
  "exit.deliver": { label: "Sortie livrée", tone: "border-primary/40 text-primary" },
  "user.create": { label: "Création utilisateur", tone: "border-accent/40 text-accent" },
  "user.update": { label: "Modification utilisateur", tone: "border-warning/40 text-warning" },
  "export.run": { label: "Export", tone: "border-muted-foreground/40 text-muted-foreground" },
};

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [auditData, usersData] = await Promise.all([getAuditLogs(), listUsersWithRoles()]);
        const logsData = Array.isArray(auditData) ? auditData : auditData?.audit || [];
        const users = Array.isArray(usersData) ? usersData : usersData?.users || [];
        setLogs([...logsData].sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())).slice(0, 500));
        setProfiles(Object.fromEntries(users.map((u: any) => [String(u.id), u])));
      } catch (error) {
        console.error('[AUDIT] Failed to load audit logs', error);
        setLogs([]);
        setProfiles({});
      }
    };
    void load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, action, startDate, endDate]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (action !== "all" && l.action !== action) return false;
      if (startDate) {
        const created = new Date(l.created_at);
        if (created < new Date(startDate)) return false;
      }
      if (endDate) {
        const created = new Date(l.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      if (search) {
        const p = profiles[String(l.user_id)];
        const hay = `${l.action} ${l.entity_type ?? ""} ${p?.full_name ?? ""} ${p?.email ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, profiles, action, search, startDate, endDate]);

  const perPage = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        subtitle="Traçabilité complète des actions : connexions, mouvements, validations et modifications."
      />
      <Card className="p-4 shadow-soft mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher utilisateur, action, entité…" className="pl-9" />
          </div>
          <div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Date début" />
          </div>
          <div>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Date fin" />
          </div>
          <div className="md:col-span-3">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{filtered.length} événement{filtered.length > 1 ? "s" : ""}</h3>
          </div>
          <div className="text-sm text-muted-foreground">Page {page} / {pages}</div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <div className="mt-2 font-medium text-sm">Aucun événement</div>
            <div className="text-xs">Les actions des utilisateurs s'enregistreront ici.</div>
          </div>
        ) : (
          <div className="space-y-0">
            {pageItems.map((l) => {
              const p = profiles[String(l.user_id)];
              const initials = (p?.full_name ?? p?.email ?? "?").slice(0, 2).toUpperCase();
              const cfg = ACTION_LABELS[l.action] ?? { label: l.action, tone: "" };
              return (
                <div key={l.id} className="relative pl-10 pb-5 border-l-2 border-border last:border-transparent">
                  <Avatar className="absolute -left-[18px] top-0 h-8 w-8 ring-4 ring-background">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{p?.full_name ?? p?.email ?? "Utilisateur"}</span>
                    <Badge variant="outline" className={cfg.tone}>{cfg.label}</Badge>
                    {l.entity_type && (
                      <span className="text-xs text-muted-foreground">sur {l.entity_type}</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground font-mono">
                      {new Date(l.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {(l.old_value || l.new_value) && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      {l.old_value && (
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 font-mono text-[11px] overflow-x-auto">
                          <div className="text-destructive font-semibold mb-1">Avant</div>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(l.old_value, null, 1)}</pre>
                        </div>
                      )}
                      {l.new_value && (
                        <div className="rounded-lg bg-success/5 border border-success/20 p-2 font-mono text-[11px] overflow-x-auto">
                          <div className="text-success font-semibold mb-1">Après</div>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(l.new_value, null, 1)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {pages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-6 text-sm text-muted-foreground">
            <div>{pageItems.length} événement{pageItems.length > 1 ? "s" : ""} affiché{pageItems.length > 1 ? "s" : ""}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5" /> Précédent
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                className="rounded-lg border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}