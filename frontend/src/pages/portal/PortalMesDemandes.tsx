import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Hourglass, CheckCircle2, XCircle, Truck, Search, Package, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getBons } from "@/services/localStoreAdapter";

const labelMap: Record<string, string> = {
  brouillon: "Brouillon", en_attente: "En attente", validee: "Validée", rejetee: "Rejetée", livree: "Livrée",
};
const tone: Record<string, string> = {
  brouillon: "bg-secondary text-muted-foreground border-border", en_attente: "bg-warning/10 text-warning border-warning/30", validee: "bg-success/10 text-success border-success/30", rejetee: "bg-destructive/10 text-destructive border-destructive/30", livree: "bg-primary/10 text-primary border-primary/30",
};

export default function PortalMesDemandes() {
  const { profile } = useAuth();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const bons = await getBons();
        if (!active) return;
        setDemandes(Array.isArray(bons) ? bons.filter((b) => String(b.demandeur_id) === String(profile?.id)) : []);
      } catch (error) {
        console.error('Failed to load demandes', error);
        if (active) setDemandes([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (profile?.id) {
      void load();
    } else {
      setDemandes([]);
      setLoading(false);
    }

    return () => { active = false; };
  }, [profile?.id]);

  const exits = demandes;
  const filtered = useMemo(() => exits.filter((e) => {
    if (!q) return true;
    return ((e.bon_number ?? "").toLowerCase().includes(q.toLowerCase()) || (e.items?.name ?? "").toLowerCase().includes(q.toLowerCase()));
  }), [exits, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    total: exits.length,
    en_attente: exits.filter(e => e.status === "en_attente").length,
    validee: exits.filter(e => e.status === "validee").length,
    rejetee: exits.filter(e => e.status === "rejetee").length,
    livree: exits.filter(e => e.status === "livree").length,
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Mes demandes</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivez l'état de toutes vos demandes de matériel.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Total Demandes" value={counts.total} icon={ClipboardList} tone="muted" />
        <Stat label="En attente" value={counts.en_attente} icon={Hourglass} tone="warning" />
        <Stat label="Validées" value={counts.validee} icon={CheckCircle2} tone="success" />
        <Stat label="Rejetées" value={counts.rejetee} icon={XCircle} tone="destructive" />
        <Stat label="Livrées" value={counts.livree} icon={Truck} tone="primary" />
      </div>

      <Card className="mt-6 p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher une demande…" className="pl-9" />
          </div>
          <Button className="bg-gradient-primary text-primary-foreground"><Search className="mr-2 h-4 w-4" /> Filtrer</Button>
        </div>
      </Card>

      <Card className="mt-4 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-6 py-3">N° Demande</th><th className="py-3">Article</th><th className="py-3">Qté</th><th className="py-3">Date</th><th className="py-3">Statut</th><th className="py-3 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Chargement des demandes…</td></tr>
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Aucune demande pour le moment.</td></tr>
            ) : pageItems.map((d) => (
              <tr key={d.id} className="hover:bg-secondary/30">
                <td className="px-6 py-4 font-semibold text-primary">#{d.bon_number ?? d.numero ?? '—'}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="font-medium">{d.items?.name ?? d.product_name ?? '—'}</div>
                  </div>
                </td>
                <td className="py-4 font-mono">{String(d.quantity ?? d.quantite ?? 0).padStart(2, '0')}</td>
                <td className="py-4 text-muted-foreground">{d.exit_date ? new Date(d.exit_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                <td className="py-4"><Badge variant="outline" className={tone[d.status] ?? 'bg-secondary text-muted-foreground'}>{labelMap[d.status] ?? 'En attente'}</Badge></td>
                <td className="py-4 pr-6"><Button size="icon" variant="ghost" className="text-primary"><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/20">
          <div className="text-xs text-muted-foreground">Affichage de 1–{pageItems.length} sur {filtered.length} demandes</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-3 w-3" /></Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} size="sm" variant={n === page ? 'default' : 'outline'} className={n === page ? 'bg-primary text-primary-foreground' : ''} onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value, icon: Icon, tone }: any) {
  const tones: Record<string, string> = { muted: 'border-l-muted-foreground/40', warning: 'border-l-warning', success: 'border-l-success', destructive: 'border-l-destructive', primary: 'border-l-primary' };
  const ic: Record<string, string> = { muted: 'text-muted-foreground', warning: 'text-warning', success: 'text-success', destructive: 'text-destructive', primary: 'text-primary' };
  return (
    <Card className={`p-4 shadow-soft border-l-4 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-2xl font-extrabold">{String(value).padStart(2, '0')}</div>
        <Icon className={`h-5 w-5 ${ic[tone]}`} />
      </div>
    </Card>
  );
}
