import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, AlertTriangle, ArrowLeftRight, Bell, Calendar, Download, PieChart as PieIcon, Inbox, Clock, CalendarClock, OctagonAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { expiryStatus } from "@/lib/expiry";
import { getProducts, getPoles, getRecentMovements } from "@/services/localStoreAdapter";

// [DASHBOARD] Helper: normalize date string to YYYY-MM-DD
function dateKey(d: any) {
  if (!d) return null;
  try {
    // If already like YYYY-MM-DD
    if (typeof d === 'string' && d.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  } catch (e) {
    return null;
  }
}

function getNumber(v: any) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.-]/g, '');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export default function Dashboard() {
  const { roles, profile } = useAuth();
  const isAdmin = roles.some((r: any) => (r || '').toString().toLowerCase() === 'admin');
  const [items, setItems] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [exits, setExits] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const periodDays = 7;

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('[DASHBOARD] Fetching products/poles/movements...');
      try {
        const products = await getProducts();
        console.log('[DASHBOARD] products count', Array.isArray(products) ? products.length : typeof products);
        if (!mounted) return;
        // ensure common fields
        const normalizedProducts = (Array.isArray(products) ? products : []).map((p: any) => ({
          ...p,
          name: p.name ?? p.libelle ?? p.nom,
          quantity: p.quantity ?? p.qty ?? p.quantite ?? p.stock ?? p.available ?? 0,
          min_threshold: p.min_threshold ?? p.minThreshold ?? p.seuil_alerte ?? p.alert_threshold ?? 0,
          pole_id: p.pole_id ?? p.poleId ?? p.pole ?? null,
          expires_at: p.expires_at ?? p.expiry_date ?? p.date_peremption ?? p.expiration_date ?? null,
        }));
        setItems(normalizedProducts.sort((a: any, b: any) => (a.name || '').toString().localeCompare((b.name || '').toString())));

        const polesData = await getPoles();
        console.log('[DASHBOARD] poles count', Array.isArray(polesData) ? polesData.length : typeof polesData);
        if (!mounted) return;
        const normalizedPoles = (Array.isArray(polesData) ? polesData : []).map((p: any) => ({ id: p.id ?? p.pole_id ?? String(p._id ?? p.id), name: p.name ?? p.libelle ?? p.nom }));
        setPoles(normalizedPoles);

        const movements = await getRecentMovements();
        console.log('[DASHBOARD] movements fetched', Array.isArray(movements) ? movements.length : typeof movements);
        if (!mounted) return;
        const ents = (Array.isArray(movements) ? movements : []).filter((m: any) => {
          const t = (m.type || m.type_mouvement || '').toString().toLowerCase();
          return t.includes('entree') || t.includes('entrée') || t.includes('in');
        });
        const exs = (Array.isArray(movements) ? movements : []).filter((m: any) => {
          const t = (m.type || m.type_mouvement || '').toString().toLowerCase();
          return t.includes('sortie') || t.includes('out') || t.includes('exit');
        });

        const mapWithProduct = (m: any) => ({
          ...m,
          items: m.product ? { name: m.product.libelle ?? m.product.name ?? m.product.nom } : (m.product_name ? { name: m.product_name } : undefined),
          created_at: m.date || m.date_mouvement || m.created_at || m.createdAt,
          entry_date: m.date || m.date_mouvement || m.entry_date || m.entryDate || m.created_at || m.createdAt,
          exit_date: m.date || m.date_mouvement || m.exit_date || m.exitDate || m.created_at || m.createdAt,
          quantity: getNumber(m.quantity ?? m.qty ?? m.quantite),
          status: (m.status || m.statut || '').toString().toLowerCase(),
        });

        setEntries(ents.map(mapWithProduct));
        setExits(exs.map(mapWithProduct));

        // Pending - try to count bons with status 'emis' from /api/bons
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/bons`);
          if (resp.ok) {
            const bons = await resp.json();
            const pending = Array.isArray(bons) ? bons.filter((b: any) => { const s = (b.statut || b.status || '').toString().toLowerCase(); return s === 'emis' || s === 'en_attente' || s === 'pending' || s === 'waiting'; }).length : 0;
            setPendingCount(pending);
          }
        } catch (e) {
          console.warn('[DASHBOARD] failed to fetch bons', e);
        }
      } catch (e) {
        console.error('[DASHBOARD] fetch error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const lowStock = useMemo(() => items.filter(i => {
    const q = getNumber(i.quantity);
    const min = getNumber(i.min_threshold);
    return q <= min;
  }), [items]);

  const movements = entries.length + exits.length;
  const empty = items.length === 0;

  const expCounts = useMemo(() => {
    const c = { expired: 0, soon: 0, valid: 0 };
    items.forEach((i) => {
      const s = expiryStatus(i.expires_at);
      if (s === "expired") c.expired++; else if (s === "soon") c.soon++; else if (s === "valid") c.valid++;
    });
    return c;
  }, [items]);

  const recent = useMemo(() => [
    ...entries.slice(0, 5).map(e => ({ ...e, type: "Entrée", date: e.entry_date })),
    ...exits.slice(0, 5).map(e => ({ ...e, type: "Sortie", date: e.exit_date })),
  ].sort((a, b) => (String(b.created_at ?? "")).localeCompare(String(a.created_at ?? ""))).slice(0, 6), [entries, exits]);

  // Build movement series using selected periodDays
  const series = useMemo(() => {
    const days: { day: string; entrees: number; sorties: number }[] = [];
    for (let d = periodDays - 1; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });
      const entrees = entries.filter(e => dateKey(e.entry_date) === key).reduce((s, e) => s + getNumber(e.quantity), 0);
      const sorties = exits.filter(e => dateKey(e.exit_date) === key).reduce((s, e) => s + getNumber(e.quantity), 0);
      days.push({ day: label, entrees, sorties });
    }
    console.log('[DASHBOARD] series computed', { periodDays, seriesLen: days.length, sample: days.slice(-3) });
    return days;
  }, [entries, exits, periodDays]);

  // Pie distribution by pole (count of items)
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(it => {
      const poleId = it.pole_id ?? it.poleId ?? it.pole ?? null;
      const name = (poles.find(p => String(p.id) === String(poleId))?.name) ?? "Non assigné";
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    const res = Array.from(map, ([name, value]) => ({ name, value }));
    console.log('[DASHBOARD] pieData', res);
    return res;
  }, [items, poles]);

  const hasMovements = series.some(d => d.entrees > 0 || d.sorties > 0);


  // Simple CSV export for movements (Excel friendly)
  const exportExcel = useCallback(() => {
    try {
      const rows = [['Date', 'Entrées', 'Sorties'], ...series.map(s => [s.day, String(s.entrees), String(s.sorties)])];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mouvements_${periodDays}d.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('[DASHBOARD] exportExcel', e); }
  }, [series, periodDays]);

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <>
      <PageHeader
        title={`Bonjour${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle={isAdmin ? "Vue d'ensemble de l'inventaire CMC Casablanca-Settat." : "Consultez le stock et créez vos demandes de sortie."}
        actions={isAdmin ? <>
          <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Période</Button>
          <Button onClick={exportExcel} className="bg-primary"><Download className="mr-2 h-4 w-4" /> Exporter</Button>
        </> : null}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total articles" value={empty ? "--" : items.length.toLocaleString("fr-FR")} icon={ClipboardCheck} sub={empty ? "Aucune donnée disponible" : `Catalogue actif`} />
        <KpiCard label="Alertes stock bas" value={empty ? "--" : lowStock.length.toString()} icon={AlertTriangle} sub={empty ? "Aucune donnée disponible" : (lowStock.length ? "À réapprovisionner" : "Tous les seuils respectés")} tone={lowStock.length ? "danger" : "default"} />
        <KpiCard label="Mouvements (7j)" value={movements === 0 ? "--" : movements.toString()} icon={ArrowLeftRight} sub={movements === 0 ? "Aucun mouvement enregistré" : "Entrées + sorties"} />
        <KpiCard label="Demandes en attente" value={pendingCount === 0 ? "--" : pendingCount.toString()} icon={Clock} sub={pendingCount === 0 ? "Aucune demande" : "À valider"} tone={pendingCount > 0 ? "warning" : "default"} />
      </div>

      {isAdmin && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <KpiCard label="Produits expirés"       value={expCounts.expired.toString()} icon={OctagonAlert}  sub="À retirer du stock"        tone={expCounts.expired > 0 ? "danger" : "default"} />
          <KpiCard label="Bientôt expirés (30j)"  value={expCounts.soon.toString()}    icon={CalendarClock} sub="À surveiller"              tone={expCounts.soon > 0 ? "warning" : "default"} />
          <KpiCard label="Produits valides"       value={expCounts.valid.toString()}   icon={CheckCircle2}  sub="Consommables conformes" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-soft">
  <div className="flex items-center justify-between">
     <h3 className="font-semibold">
    Mouvements de stock
  </h3>

  <div className="text-sm text-muted-foreground">
    7 derniers jours
  </div>
</div>
  

  {hasMovements ? (
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
          />

          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />

          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />

          <Legend wrapperStyle={{ fontSize: 12 }} />

          <Bar
            dataKey="entrees"
            name="Entrées"
            fill="#2FB36D"
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="sorties"
            name="Sorties"
            fill="#1E40AF"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <ChartPlaceholder
      icon={ArrowLeftRight}
      label="Aucun mouvement sur 7 jours"
      hint="Le graphique s'activera dès l'enregistrement des premières entrées ou sorties validées."
    />
  )}
</Card>
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 text-destructive font-semibold"><Bell className="h-4 w-4" /> Alertes prioritaires</div>
          <div className="mt-4 space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune alerte. Tous les seuils sont respectés.</p>
            ) : lowStock.slice(0, 4).map(i => (
              <div key={i.id} className="rounded-lg border-l-4 border-destructive bg-destructive/5 p-3">
                <div className="font-semibold text-sm">{i.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Actuel : {getNumber(i.quantity)} | Min : {getNumber(i.min_threshold)}</div>
              </div>
            ))}
          </div>
          {lowStock.length > 4 && (
            <Button asChild variant="outline" className="mt-4 w-full"><Link to="/stock">Voir toutes les alertes</Link></Button>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Activités récentes</h3>
            <Link to="/reports" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2">Article</th><th className="pb-2">Type</th><th className="pb-2">Qté</th><th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.length === 0 && (
                  <tr><td colSpan={4}>
                    <EmptyState icon={Inbox} title="Aucun mouvement enregistré" hint="Les entrées et sorties apparaîtront ici." />
                  </td></tr>
                )}
                {recent.map((m: any) => (
                  <tr key={m.type + m.id}>
                    <td className="py-3 font-medium">{m.items?.name ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">{m.type}</td>
                    <td className="py-3 font-mono">{m.type === "Entrée" ? "+" : "−"}{getNumber(m.quantity)}</td>
                    <td className="py-3 text-muted-foreground">{m.date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Répartition par pôle</h4>
            <PieIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          {pieData.length > 0 ? (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartPlaceholder icon={PieIcon} label="Aucune donnée disponible" hint="Distribution du stock par pôle métier." compact />
          )}
          {pieData.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {pieData.slice(0, 5).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <span className="font-mono font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon: Icon, sub, tone }: any) {
  const toneCls =
    tone === "danger" ? "bg-destructive/10 text-destructive" :
    tone === "warning" ? "bg-warning/10 text-warning" :
    "bg-primary/10 text-primary";
  const valueCls =
    tone === "danger" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    "text-primary";
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={`mt-3 text-3xl font-bold ${valueCls}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}

function ChartPlaceholder({ icon: Icon, label, hint, compact }: any) {
  return (
    <div className={`mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 ${compact ? "h-48" : "h-64"} text-center px-6`}>
      <Icon className="h-8 w-8 text-muted-foreground/60" />
      <div className="mt-3 font-medium">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground max-w-xs">{hint}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: any) {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <Icon className="h-7 w-7 text-muted-foreground/60" />
      <div className="mt-2 font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
