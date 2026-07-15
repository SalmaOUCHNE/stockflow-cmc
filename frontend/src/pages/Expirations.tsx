import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, AlertTriangle, OctagonAlert, CheckCircle2, Search } from "lucide-react";
import { expiryInfo } from "@/lib/expiry";
import { getProducts } from "@/services/localStoreAdapter";

export default function Expirations() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "expired" | "soon" | "valid">("all");

  useEffect(() => {
    const load = async () => {
      try {
        const products = await getProducts();
        setItems(Array.isArray(products) ? products.filter((i: any) => i.expires_at).sort((a: any, b: any) => (a.expires_at ?? "").localeCompare(b.expires_at ?? "")) : []);
      } catch (error) {
        console.error('[EXPIRATIONS] Failed to load products', error);
        setItems([]);
      }
    };
    void load();
  }, []);

  const enriched = useMemo(() => items.map((i: any) => ({ ...i, _exp: expiryInfo(i.expires_at) })), [items]);
  const counts = useMemo(() => ({
    expired: enriched.filter((i) => i._exp?.status === "expired").length,
    soon:    enriched.filter((i) => i._exp?.status === "soon").length,
    valid:   enriched.filter((i) => i._exp?.status === "valid").length,
  }), [enriched]);

  const filtered = enriched.filter((i) => {
    if (filter !== "all" && i._exp?.status !== filter) return false;
    if (q && !`${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Suivi des expirations" subtitle="Surveillez les dates d'expiration des consommables." />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Produits expirés"        value={counts.expired} icon={OctagonAlert}  tone="danger"  active={filter === "expired"} onClick={() => setFilter(filter === "expired" ? "all" : "expired")} />
        <Kpi label="Bientôt expirés (≤30j)"  value={counts.soon}    icon={AlertTriangle} tone="warning" active={filter === "soon"}    onClick={() => setFilter(filter === "soon" ? "all" : "soon")} />
        <Kpi label="Produits valides"        value={counts.valid}   icon={CheckCircle2}  tone="success" active={filter === "valid"}   onClick={() => setFilter(filter === "valid" ? "all" : "valid")} />
      </div>

      <Card className="mt-6 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article…" className="pl-9" />
          </div>
          {filter !== "all" && <Button size="sm" variant="ghost" onClick={() => setFilter("all")}>Effacer le filtre</Button>}
          <div className="ml-auto text-sm text-muted-foreground">{filtered.length} articles</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-3">Article</th><th className="py-3">SKU</th><th className="py-3">Date d'expiration</th><th className="py-3">Statut</th><th className="py-3">Quantité</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Aucun article correspondant.</td></tr>
              )}
              {filtered.map((i: any) => {
                const e = i._exp!;
                const cls = e.tone === "danger" ? "bg-destructive/10 text-destructive" : e.tone === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";
                return (
                  <tr key={i.id} className="hover:bg-secondary/40">
                    <td className="py-3 font-medium">{i.name}</td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{i.sku}</td>
                    <td className="py-3"><span className="inline-flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {new Date(i.expires_at).toLocaleDateString("fr-FR")}</span></td>
                    <td className="py-3"><Badge className={cls + " border-transparent"}>{e.label}</Badge></td>
                    <td className="py-3 font-mono">{i.quantity}</td>
                    <td className="py-3 text-right"><Button asChild variant="ghost" size="sm"><Link to={`/stock/${i.id}`}>Voir</Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Kpi({ label, value, icon: Icon, tone, active, onClick }: any) {
  const tones: any = { danger: "bg-destructive/10 text-destructive", warning: "bg-warning/10 text-warning", success: "bg-success/10 text-success" };
  const valTones: any = { danger: "text-destructive", warning: "text-warning", success: "text-success" };
  return (
    <button type="button" onClick={onClick} className={`text-left transition-all ${active ? "ring-2 ring-primary" : ""}`}>
      <Card className="p-5 shadow-soft hover:shadow-elegant transition-shadow">
        <div className="flex items-start justify-between">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
        </div>
        <div className={`mt-3 text-3xl font-bold ${valTones[tone]}`}>{value}</div>
      </Card>
    </button>
  );
}