import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileDown,
  FileSpreadsheet,
  ArrowDown,
  ArrowUp,
  BarChart3,
  PieChart as PieIcon,
  Inbox,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getProducts, getPoles, getRecentMovements, getBons, getAuditLogs, getFilieres, listUsersWithRoles, getInventorySessions } from "@/services/localStoreAdapter";

export default function Reports() {
  const [entries, setEntries] = useState<any[]>([]);
  const [exits, setExits] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [bons, setBons] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inventorySessions, setInventorySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10));
  const [filterDateTo, setFilterDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedPole, setSelectedPole] = useState<string>("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsData, polesData, filieresData, movementsData, bonsData, auditData, usersData, inventorySessionsData] = await Promise.all([
          getProducts(),
          getPoles(),
          getFilieres(),
          getRecentMovements(),
          getBons(),
          getAuditLogs(),
          listUsersWithRoles(),
          getInventorySessions(),
        ]);

        setItems(Array.isArray(productsData) ? productsData : []);
        setPoles(Array.isArray(polesData) ? polesData : []);
        setFilieres(Array.isArray(filieresData) ? filieresData : []);
        setBons(Array.isArray(bonsData) ? bonsData : (bonsData?.bons || []));
        setAudits(Array.isArray(auditData) ? auditData : (auditData?.audit || []));
        setUsers(Array.isArray(usersData) ? usersData : (usersData?.users || []));
        setInventorySessions(Array.isArray(inventorySessionsData) ? inventorySessionsData : []);

        const normalizedMovements = Array.isArray(movementsData) ? movementsData : [];
        setEntries(normalizedMovements.filter((m: any) => String(m.type || '').toLowerCase().includes('entree')));
        setExits(normalizedMovements.filter((m: any) => String(m.type || '').toLowerCase().includes('sortie')));
      } catch (error) {
        console.warn("Failed to load reports data", error);
        setError('Impossible de charger les rapports. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    void loadReports();
  }, []);

  const totals = useMemo(
    () => ({
      products: items.length,
      entries: entries.length,
      exits: exits.length,
      bons: bons.length,
      audits: audits.length,
      inventorySessions: inventorySessions.length,
    }),
    [items.length, entries.length, exits.length, bons.length, audits.length, inventorySessions.length],
  );

  const stockByFiliere = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const label = filieres.find((f) => String(f.id) === String(item.filiere_id))?.name || item.category || "Sans filière";
      counts[label] = (counts[label] || 0) + (item.quantity ?? 0);
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [items, filieres]);

  const productMap = useMemo(
    () => items.reduce((acc: Record<string, any>, item: any) => {
      if (item.id) acc[String(item.id)] = item;
      return acc;
    }, {}),
    [items],
  );

  const userMap = useMemo(
    () => users.reduce((acc: Record<string, any>, userObj: any) => {
      if (userObj.id) acc[String(userObj.id)] = userObj;
      return acc;
    }, {}),
    [users],
  );

  const normalizedMovements = useMemo(
    () => [...entries, ...exits].map((movement) => {
      const product = movement.product || productMap[String(movement.product_id)] || {};
      const userItem = userMap[String(movement.user_id)] || {};
      return {
        ...movement,
        type: String(movement.type || '').toLowerCase().includes('entree') ? 'Entrée' : 'Sortie',
        items: {
          id: product.id,
          name: product.name || product.libelle || product.reference || 'Article inconnu',
          sku: product.sku || product.reference || '',
          unit: product.unit || product.unite_mesure || '',
          pole_id: product.pole_id,
          filiere_id: product.filiere_id,
        },
        profile: {
          full_name: userItem.full_name || `${userItem.prenom ?? ''} ${userItem.nom ?? ''}`.trim() || 'Utilisateur',
        },
      };
    }),
    [entries, exits, productMap, userMap],
  );

  const filteredMovements = useMemo(() => {
    const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
    const toDate = filterDateTo ? new Date(filterDateTo) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);

    return normalizedMovements.filter((movement) => {
      const dateValue = movement.date || movement.created_at || movement.raw?.date || movement.raw?.created_at;
      const date = dateValue ? new Date(dateValue) : null;
      if (fromDate && date && date < fromDate) return false;
      if (toDate && date && date > toDate) return false;
      if (selectedPole && String(movement.items?.pole_id) !== String(selectedPole)) return false;
      if (selectedFiliere && String(movement.items?.filiere_id) !== String(selectedFiliere)) return false;
      if (selectedProduct && String(movement.items?.id) !== String(selectedProduct)) return false;
      if (search) {
        const hay = `${movement.items?.name ?? ''} ${movement.profile?.full_name ?? ''} ${movement.type ?? ''}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      }
      return true;
    });
  }, [normalizedMovements, filterDateFrom, filterDateTo, selectedPole, selectedFiliere, selectedProduct, search]);

  const monthlyData = useMemo(() => {
    const buckets: Record<string, { month: string; entries: number; exits: number }> = {};
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const label = monthDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      buckets[label] = { month: label, entries: 0, exits: 0 };
    }
    filteredMovements.forEach((movement) => {
      const dateValue = movement.date || movement.created_at || movement.raw?.date || movement.raw?.created_at;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const label = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      if (!buckets[label]) return;
      const type = String(movement.type || '').toLowerCase();
      if (type.includes('entree') || type.includes('entrée') || type.includes('entry')) buckets[label].entries += 1;
      if (type.includes('sortie') || type.includes('exit')) buckets[label].exits += 1;
    });
    return Object.values(buckets);
  }, [filteredMovements]);

  const movements = useMemo(
    () =>
      filteredMovements
        .sort((a, b) => new Date(b.created_at || b.date || '').getTime() - new Date(a.created_at || a.date || '').getTime())
        .slice(0, 10),
    [filteredMovements],
  );

  const exportCsv = () => {
    const rows = [
      ["Date", "Type", "Article", "Quantité", "Utilisateur", "Référence"],
      ...filteredMovements.map((m) => [
        new Date(m.created_at || m.date || "").toLocaleString("fr-FR"),
        m.type,
        m.items?.name || m.product?.libelle || "—",
        m.quantity ?? "",
        m.profile?.full_name || "—",
        m.items?.sku || m.product?.sku || "—",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapports-mouvements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportExcel = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Rapports de stock</title></head><body><table border="1" cellpadding="4" cellspacing="0"><tr><th>Date</th><th>Type</th><th>Article</th><th>Quantité</th><th>Utilisateur</th><th>Référence</th></tr>${filteredMovements
      .map(
        (m) =>
          `<tr><td>${new Date(m.created_at || m.date || "").toLocaleString("fr-FR")}</td><td>${m.type}</td><td>${m.items?.name || m.product?.libelle || "—"}</td><td>${m.quantity ?? ""}</td><td>${m.profile?.full_name || "—"}</td><td>${m.items?.sku || m.product?.sku || "—"}</td></tr>`,
      )
      .join("")}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapports-mouvements-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
  };

  const loadHtml2Pdf = async () => {
    const globalHtml2Pdf = (window as any).html2pdf;
    if (globalHtml2Pdf) return globalHtml2Pdf;
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.14.0/html2pdf.bundle.min.js";
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = (error) => reject(new Error(`Impossible de charger html2pdf: ${error}`));
      document.body.appendChild(script);
    });
  };

  const exportPdf = async () => {
    const target = document.getElementById("report-print-area");
    if (!target) return;
    try {
      const html2pdf = await loadHtml2Pdf();
      html2pdf()
        .set({
          margin: 15,
          filename: `rapports-stock-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(target)
        .save();
    } catch (error) {
      console.error("PDF export failed", error);
    }
  };

  return (
    <>
      <PageHeader
        title="Rapports & Suivi"
        subtitle="Analyses complètes et traçabilité totale des mouvements pour le hub de Casablanca."
        actions={
          <>
            <Button variant="outline" onClick={exportPdf}>
              <FileDown className="mr-2 h-4 w-4 text-destructive" /> Exporter PDF
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-success" /> Exporter Excel
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4 text-primary" /> Exporter CSV
            </Button>
          </>
        }
      />

      <Card className="p-4 shadow-soft mb-6">
        <div className="grid gap-4 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Recherche</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Article, utilisateur, type..." className="mt-2" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date début</Label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date fin</Label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pôle</Label>
            <Select value={selectedPole} onValueChange={(v) => { setSelectedPole(v); setSelectedFiliere(''); }}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Filtrer par pôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-poles">Tous les pôles</SelectItem>
                {poles.filter((p) => p.id).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Filière</Label>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere} disabled={!selectedPole}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={selectedPole ? "Filtrer par filière" : "Choisir un pôle d'abord"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-filieres">Toutes les filières</SelectItem>
                {filieres.filter((f) => f.id && (!selectedPole || String(f.pole_id) === String(selectedPole))).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Article</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Tous les articles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-products">Tous les articles</SelectItem>
                {items.filter((item) => item.id).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div id="report-print-area">
        {loading ? (
          <Card className="p-6 shadow-soft mb-6">
            <div className="text-sm text-muted-foreground">Chargement des rapports…</div>
          </Card>
        ) : error ? (
          <Card className="p-6 shadow-soft mb-6 border border-destructive/20 bg-destructive/5">
            <div className="text-sm text-destructive">{error}</div>
          </Card>
        ) : (
          <>
            <Card className="p-4 shadow-soft mb-6">
          <div className="grid gap-4 lg:grid-cols-6">
            <SummaryCard label="Produits" value={totals.products} tone="primary" />
            <SummaryCard label="Entrées" value={totals.entries} tone="success" />
            <SummaryCard label="Sorties" value={totals.exits} tone="destructive" />
            <SummaryCard label="Bons" value={totals.bons} tone="secondary" />
            <SummaryCard label="Inventaires" value={totals.inventorySessions} tone="accent" />
            <SummaryCard label="Audits" value={totals.audits} tone="muted" />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Évolution des mouvements</h3>
              <span className="text-xs text-muted-foreground">6 derniers mois</span>
            </div>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, "Mouvements"]} />
                  <Legend />
                  <Line type="monotone" dataKey="entries" stroke="#22c55e" name="Entrées" strokeWidth={3} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="exits" stroke="#ef4444" name="Sorties" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Stock par filière</h3>
              <span className="text-xs text-muted-foreground">Quantités réelles</span>
            </div>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockByFiliere} dataKey="value" nameKey="name" innerRadius={45} outerRadius={95} paddingAngle={3}>
                    {stockByFiliere.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Derniers mouvements</h3>
            <span className="text-xs text-muted-foreground">Top 10 récents</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-3">Date</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Article</th>
                  <th className="py-3">Quantité</th>
                  <th className="py-3">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">Aucun mouvement récent.</td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={`${m.type}-${m.id}`} className="hover:bg-secondary/40">
                      <td className="py-3 font-mono text-xs text-muted-foreground">{new Date(m.created_at || m.date || "").toLocaleString("fr-FR")}</td>
                      <td className="py-3 font-medium">{m.type}</td>
                      <td className="py-3">{m.items?.name ?? m.product?.libelle ?? "—"}</td>
                      <td className="py-3 font-mono">{m.quantity ?? ""}</td>
                      <td className="py-3 text-muted-foreground">{m.profile?.full_name ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
              </>
            )}
          </div>
        </>
      );
    }

const PIE_COLORS = ["#14b8a6", "#22c55e", "#f59e0b", "#fb7185", "#6366f1", "#f97316"];

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const classes: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    muted: "bg-muted/10 text-muted-foreground",
  };

  return (
    <Card className="p-5 shadow-soft">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-3 text-3xl font-bold ${classes[tone] ?? "text-foreground"}`}>{value}</div>
    </Card>
  );
}
