import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, FileDown, ClipboardCheck, AlertTriangle, OctagonAlert, Network, Wrench, Package as PackIcon, FlaskConical, Cog, Eye, Pencil, Trash2 } from "lucide-react";
import { getProducts, getPoles, getFilieres, getCategories, deleteItemLocal } from "@/services/localStoreAdapter";

export default function Stock() {
  const [items, setItems] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filiere, setFiliere] = useState("all");
  const [pole, setPole] = useState("all");
  const [cat, setCat] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshStock = async () => {
    try {
      console.log('[STOCK PAGE] Refreshing stock...');
      const [products, polesData, filieresData, categoriesData] = await Promise.all([getProducts(), getPoles(), getFilieres(), getCategories()]);
      console.log('[STOCK PAGE] API products:', products);
      setItems(Array.isArray(products) ? products.sort((a, b) => String(a.name).localeCompare(String(b.name))) : []);
      setPoles(Array.isArray(polesData) ? polesData : []);
      setFilieres(Array.isArray(filieresData) ? filieresData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (e) {
      console.warn('[STOCK PAGE] Failed to load reference data', e);
      setItems([]);
      setPoles([]);
      setFilieres([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    void refreshStock();
  }, []);

  const categoriesOptions = useMemo(() => {
    if (categories && categories.length) return categories;
    return Array.from(new Set(items.map(i => i.category).filter(Boolean))).map((name) => ({ id: name, name }));
  }, [items, categories]);

  const filtered = items.filter(i =>
    (filiere === "all" || i.filiere_id === filiere) &&
    (pole === "all" || i.pole_id === pole) &&
    (cat === "all" || String(i.category_id) === String(cat) || i.category === cat)
  );

  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.min_threshold).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;

  const status = (q: number, m: number) => q === 0 ? "Rupture" : q <= m ? "Stock bas" : "Disponible";
  const statusColor = (s: string) => s === "Rupture" ? "bg-destructive/10 text-destructive" : s === "Stock bas" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";

  const exportCsv = () => {
    const rows = [["Nom", "SKU", "Catégorie", "Quantité", "Unité", "Seuil min", "Emplacement"]];
    filtered.forEach(i => rows.push([i.name, i.sku ?? "", i.category ?? "", i.quantity, i.unit, i.min_threshold, i.location ?? ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "stock.csv"; a.click();
  };

  const iconFor = (cat?: string) => {
    switch ((cat || "").toLowerCase()) {
      case "machine": return Cog;
      case "outil":
      case "tool": return Wrench;
      case "consommable":
      case "consumable": return FlaskConical;
      default: return PackIcon;
    }
  };

  return (
    <>
      <PageHeader
        title="Liste du stock"
        subtitle="Gérez et suivez les niveaux d'inventaire de CMC Casablanca."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" /> Exporter CSV</Button>
            <Button asChild className="bg-primary"><Link to="/stock/new"><Plus className="mr-2 h-4 w-4" /> Ajouter un article</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiTile label="Total articles" value={items.length || "--"} icon={ClipboardCheck} tone="primary" sub={items.length ? "Catalogue actif" : "Aucune donnée disponible"} />
        <KpiTile label="Stock bas" value={items.length ? lowStock : "--"} icon={AlertTriangle} tone="warning" sub={items.length ? "Sous le seuil minimum" : "Aucune donnée disponible"} />
        <KpiTile label="Rupture" value={items.length ? outOfStock : "--"} icon={OctagonAlert} tone="danger" sub={items.length ? "Articles à 0" : "Aucune donnée disponible"} />
        <KpiTile label="Filières actives" value={filieres.length} icon={Network} tone="accent" sub={`Sur ${poles.length} pôles métiers`} />
      </div>

      <Card className="mt-6 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Filière" value={filiere} onChange={setFiliere} options={[{ value: "all", label: "Toutes filières" }, ...filieres.map(f => ({ value: f.id, label: f.name }))]} />
          <FilterSelect label="Pôle" value={pole} onChange={setPole} options={[{ value: "all", label: "Tous pôles" }, ...poles.map(p => ({ value: p.id, label: p.name }))]} />
          <FilterSelect label="Catégorie" value={cat} onChange={setCat} options={[{ value: "all", label: "Toutes catégories" }, ...categoriesOptions.map((c: any) => ({ value: String(c.id ?? c.name ?? c), label: c.name ?? c }))]} />
          <div className="ml-auto text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> articles
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-3">Article</th>
                <th className="py-3">Référence</th>
                <th className="py-3">Catégorie</th>
                <th className="py-3">Quantité</th>
                <th className="py-3">Statut</th>
                <th className="py-3">Emplacement</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <div className="text-sm font-medium">Aucune donnée disponible</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {items.length === 0 ? <>Aucun article enregistré. <Link to="/stock/new" className="text-primary font-medium hover:underline">Créer le premier</Link>.</> : "Aucun article ne correspond aux filtres."}
                  </div>
                </td></tr>
              )}
              {filtered.map(i => {
                const Icon = iconFor(i.category);
                const s = status(i.quantity, i.min_threshold);
                const categoryLabel = categories.find((c) => String(c.id) === String(i.category_id))?.name ?? i.category ?? "—";
                return (
                  <tr key={i.id} className="hover:bg-secondary/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {i.image_url ? (
                          <div className="h-10 w-10 overflow-hidden rounded-lg border border-border bg-secondary">
                            <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                        )}
                        <div>
                          <div className="font-semibold">{i.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{categoryLabel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-muted-foreground">{i.sku ?? i.reference ?? "—"}</td>
                    <td className="py-3"><Badge variant="outline">{categoryLabel}</Badge></td>
                    <td className="py-3 font-mono">{i.quantity} {i.unit}</td>
                    <td className="py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(s)}`}>{s}</span></td>
                    <td className="py-3 text-muted-foreground">{i.location ?? "—"}</td>
                    <td className="py-3 text-right space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className="text-primary">
                                                      <Link to={`/stock/${i.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className="text-primary">
                            <Link to={`/catalogue/edit/${i.id}`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(i)}><Trash2 className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer</TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer l'article</DialogTitle>
                <DialogDescription>Voulez-vous vraiment supprimer cet article ? Cette action archive le produit et met à jour le catalogue.</DialogDescription>
              </DialogHeader>
              {deleteTarget && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-semibold">{deleteTarget.name}</div>
                  <div className="text-xs text-muted-foreground">SKU : {deleteTarget.sku ?? deleteTarget.reference ?? '—'}</div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
                <Button className="bg-destructive" onClick={async () => {
                  if (!deleteTarget) return;
                  setDeleteLoading(true);
                  try {
                    await deleteItemLocal(deleteTarget.id);
                    await refreshStock();
                  } catch (error) {
                    console.error('Delete product failed', error);
                  } finally {
                    setDeleteLoading(false);
                    setDeleteTarget(null);
                  }
                }} disabled={deleteLoading}>{deleteLoading ? 'Suppression…' : 'Supprimer'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: any) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function KpiTile({ label, value, icon: Icon, tone, sub }: any) {
  const tones: any = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    accent: "bg-accent/10 text-accent",
  };
  const valueTones: any = { primary: "text-primary", warning: "text-warning", danger: "text-destructive", accent: "text-accent" };
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className={`mt-3 text-3xl font-bold ${valueTones[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}