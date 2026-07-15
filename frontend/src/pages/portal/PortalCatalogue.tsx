import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle2, AlertTriangle, AlertCircle, Search, ArrowRight, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getProducts, getPoles, getFilieres } from "@/services/localStoreAdapter";

export default function PortalCatalogue() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [pole, setPole] = useState("all");
  const [filiere, setFiliere] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 4;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [products, polesData, filieresData] = await Promise.all([getProducts(), getPoles(), getFilieres()]);
        if (!active) return;
        setItems(Array.isArray(products) ? products : []);
        setPoles(Array.isArray(polesData) ? polesData : []);
        setFilieres(Array.isArray(filieresData) ? filieresData : []);
      } catch (error) {
        console.error('Failed to load catalogue', error);
        if (active) {
          setItems([]);
          setPoles([]);
          setFilieres([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).filter(Boolean), [items]);
  const filtered = useMemo(() => items.filter((i) =>
    (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || (i.sku ?? "").toLowerCase().includes(q.toLowerCase())) &&
    (cat === "all" || i.category === cat) &&
    (pole === "all" || String(i.pole_id) === String(pole)) &&
    (filiere === "all" || String(i.filiere_id) === String(filiere))
  ), [items, q, cat, pole, filiere]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: items.length,
    available: items.filter(i => i.quantity > i.min_threshold).length,
    limited: items.filter(i => i.quantity > 0 && i.quantity <= i.min_threshold).length,
    out: items.filter(i => i.quantity === 0).length,
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Catalogue des articles</h1>
        <p className="text-sm text-muted-foreground mt-1">Consultez les articles disponibles et faites vos demandes en temps réel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Articles" value={stats.total.toLocaleString('fr-FR')} pillLabel="Global"  pillTone="primary" icon={Package} tone="primary" />
        <StatCard label="Disponibles" value={stats.available.toString()} pillLabel="OK" pillTone="success" icon={CheckCircle2} tone="success" />
        <StatCard label="Stock Limité" value={stats.limited.toString()} pillLabel="Alerte" pillTone="warning" icon={AlertTriangle} tone="warning" />
        <StatCard label="Rupture" value={stats.out.toString()} pillLabel="Critique" pillTone="destructive" icon={AlertCircle} tone="destructive" />
      </div>

      <Card className="mt-6 p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Filtrer par nom ou SKU…" className="pl-9 rounded-lg" />
          </div>
          <Select value={cat} onValueChange={(v) => { setCat(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Catégorie : Toutes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Catégorie : Toutes</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={pole} onValueChange={(v) => { setPole(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Pôle : Tous" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Pôle : Tous</SelectItem>
              {poles.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filiere} onValueChange={(v) => { setFiliere(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Filière : Toutes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filière : Toutes</SelectItem>
              {filieres.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="mt-4 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/50 border-b border-border">
              <th className="px-6 py-3">Article</th><th className="py-3">Catégorie</th><th className="py-3">Disponible</th><th className="py-3">Statut</th><th className="py-3">Emplacement</th><th className="py-3 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Chargement des articles…</td></tr>
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Aucun article ne correspond aux filtres.</td></tr>
            ) : pageItems.map((it) => {
              const isOut = it.quantity === 0;
              const isLimited = !isOut && it.quantity <= it.min_threshold;
              return (
                <tr key={it.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="h-12 w-12 rounded-lg object-cover bg-secondary" loading="lazy" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-secondary" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground leading-tight">{it.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">SKU : {it.sku ?? '—'}</div>
                    </div>
                  </td>
                  <td className="py-4"><Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] tracking-wider">{it.category ?? '—'}</Badge></td>
                  <td className="py-4 font-medium">{it.quantity ?? 0} {it.unit === 'u' ? 'Unités' : it.unit ?? ''}</td>
                  <td className="py-4">
                    {isOut && <span className="inline-flex items-center gap-1.5 text-destructive font-medium"><span className="h-2 w-2 rounded-full bg-destructive" /> Indisponible</span>}
                    {isLimited && <span className="inline-flex items-center gap-1.5 text-warning font-medium"><span className="h-2 w-2 rounded-full bg-warning" /> Stock limité</span>}
                    {!isOut && !isLimited && <span className="inline-flex items-center gap-1.5 text-success font-medium"><span className="h-2 w-2 rounded-full bg-success" /> Disponible</span>}
                  </td>
                  <td className="py-4 text-muted-foreground">{it.location ?? '—'}</td>
                  <td className="py-4 pr-6 text-right flex items-center justify-end gap-2">
                    <Link to={`/portal/produit/${it.id}`} className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Voir les détails">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Button asChild disabled={isOut} className={isOut ? 'bg-muted text-muted-foreground' : 'bg-gradient-primary text-primary-foreground hover:shadow-glow'}>
                      {isOut ? <span>Indisponible</span> : <Link to={`/portal/nouvelle-demande?item=${it.id}`}>Demander <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/20">
          <div className="text-xs text-muted-foreground">Affichage de 1–{pageItems.length} sur {filtered.length} articles</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-3 w-3 mr-1" /> Précédent</Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === page ? 'default' : 'outline'} size="sm" className={n === page ? 'bg-primary text-primary-foreground' : ''} onClick={() => setPage(n)}>{n}</Button>
            ))}
            {totalPages > 3 && <><span className="px-1 text-muted-foreground">…</span><Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>{totalPages}</Button></>}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Suivant <ChevronRight className="h-3 w-3 ml-1" /></Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function StatCard({ label, value, pillLabel, pillTone, icon: Icon, tone }: any) {
  const ic: Record<string, string> = { primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', destructive: 'bg-destructive/10 text-destructive' };
  const pl: Record<string, string> = { primary: 'bg-primary/10 text-primary border-primary/20', success: 'bg-success/10 text-success border-success/20', warning: 'bg-warning/10 text-warning border-warning/20', destructive: 'bg-destructive/10 text-destructive border-destructive/20' };
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ic[tone]}`}><Icon className="h-5 w-5" /></div>
        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${pl[pillTone]}`}>{pillLabel}</Badge>
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-foreground">{value}</div>
    </Card>
  );
}
