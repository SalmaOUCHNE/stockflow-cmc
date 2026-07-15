import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Truck, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createStockEntryLocal, getProducts, getRecentMovements, getPoles, getFilieres } from "@/services/localStoreAdapter";

export default function Entries() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ item_id: "", quantity: 1, supplier: "", notes: "", entry_date: new Date().toISOString().slice(0, 10), pole_id: "", filiere_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  const resolveEntryDate = (value: string | undefined) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const buildRecentEntries = (movements: any[], products: any[]) => {
    const productMap = products.reduce((map: Record<string, any>, item: any) => {
      if (item?.id) {
        map[String(item.id)] = item;
      }
      return map;
    }, {});

    return movements
      .filter((movement: any) => String(movement.type || "").toLowerCase().includes("entree"))
      .map((movement: any) => {
        const dateValue = resolveEntryDate(movement.date_mouvement ?? movement.created_at ?? movement.date ?? movement.entry_date);
        const product = movement.product || productMap[String(movement.product_id ?? movement.item_id ?? "")] || {};
        return {
          id: movement.id ?? `${movement.product_id || movement.item_id || movement.product?.id}-${movement.created_at ?? movement.date_mouvement ?? movement.entry_date ?? ""}`,
          quantity: movement.quantity ?? movement.quantite ?? 0,
          date: dateValue,
          sku: product.sku ?? product.reference ?? movement.product?.sku ?? movement.product?.reference ?? "",
          product: {
            name: product.name ?? product.libelle ?? movement.product?.name ?? "Article inconnu",
            image_url: product.image_url ?? product.photo_url ?? null,
          },
        };
      })
      .filter((entry: any) => entry.date !== null)
      .sort((a: any, b: any) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  };

  const refresh = async () => {
    try {
      const [itemsData, movementsData, polesData, filieresData] = await Promise.all([
        getProducts(),
        getRecentMovements(),
        getPoles(),
        getFilieres(),
      ]);
      const sortedItems = Array.isArray(itemsData) ? itemsData.sort((a, b) => a.name.localeCompare(b.name)) : [];
      setItems(sortedItems);
      const recentEntries = Array.isArray(movementsData) ? buildRecentEntries(movementsData, sortedItems).slice(0, 5) : [];
      setRecent(recentEntries);
      setPoles(Array.isArray(polesData) ? polesData.sort((a, b) => a.name.localeCompare(b.name)) : []);
      setFilieres(Array.isArray(filieresData) ? filieresData.sort((a, b) => a.name.localeCompare(b.name)) : []);
    } catch (e) {
      console.warn("Failed to refresh entries data", e);
      setItems([]);
      setRecent([]);
      setPoles([]);
      setFilieres([]);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const productId = searchParams.get("productId");
    if (!productId || form.item_id) {
      return;
    }
    const selectedProduct = items.find(item => String(item.id) === String(productId));
    if (selectedProduct) {
      setForm(prev => ({ ...prev, item_id: String(selectedProduct.id) }));
    }
  }, [searchParams, items, form.item_id]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.item_id) { toast.error("Choisissez un article"); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, pole_id: form.pole_id || null, filiere_id: form.filiere_id || null, user_id: user!.id };
      await createStockEntryLocal(payload);
      toast.success("Entrée enregistrée");
      setForm({ item_id: "", quantity: 1, supplier: "", notes: "", entry_date: new Date().toISOString().slice(0, 10), pole_id: "", filiere_id: "" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stockMovementCreated", { detail: { productId: payload.product_id } }));
      }
      await refresh();
    } catch (error) {
      console.error('[ENTRIES] create entry failed', error);
      toast.error("Erreur lors de l'enregistrement de l'entrée");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Enregistrer une entrée de stock" subtitle="Ajoutez de nouveaux articles au registre d'inventaire avec les détails fournisseur." />
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <Card className="lg:col-span-2 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">Détails de l'entrée</h2>
              <p className="text-sm text-muted-foreground">Statut : Brouillon</p>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">Brouillon</Badge>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Sélectionner un article *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={form.item_id} onValueChange={v => setForm({ ...form, item_id: v })}>
                  <SelectTrigger className="pl-9"><SelectValue placeholder="Rechercher par nom ou SKU…" /></SelectTrigger>
                  <SelectContent>
                    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} {i.sku && <span className="text-muted-foreground">— {i.sku}</span>}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quantité *</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1" required />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date d'entrée *</Label>
                <Input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} className="mt-1" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pôle métier</Label>
                <Select value={form.pole_id} onValueChange={v => setForm({ ...form, pole_id: v, filiere_id: "" })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un pôle" /></SelectTrigger>
                  <SelectContent>{poles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Filière</Label>
                <Select value={form.filiere_id} onValueChange={v => setForm({ ...form, filiere_id: v })} disabled={!form.pole_id}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.pole_id ? "Sélectionner une filière" : "Choisir un pôle d'abord"} /></SelectTrigger>
                  <SelectContent>{filieres.filter(f => f.pole_id === form.pole_id).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fournisseur / Source (Optionnel)</Label>
              <div className="relative mt-1">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="ex. Casablanca Industrial Supplies SARL" className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes internes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Numéros de lot, état ou instructions de stockage…" className="mt-1 min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setForm({ item_id: "", quantity: 1, supplier: "", notes: "", entry_date: new Date().toISOString().slice(0, 10) })}>Annuler</Button>
              <Button type="submit" disabled={submitting} className="bg-primary"><CheckCircle2 className="mr-2 h-4 w-4" /> Confirmer l'entrée</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6 self-start">
          <Card className="p-6 shadow-soft bg-gradient-hero text-primary-foreground">
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center mb-4">i</div>
            <h3 className="text-xl font-bold">Intégrité de l'inventaire</h3>
            <p className="mt-2 text-sm opacity-90">Les entrées sont enregistrées immédiatement dans la piste d'audit. Vérifiez que le décompte physique correspond avant confirmation.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4" /> Met à jour automatiquement le tableau</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4" /> Génère un rapport de mouvement</li>
            </ul>
          </Card>
          <Card className="p-6 shadow-soft">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Entrées récentes</div>
            <div className="mt-3 space-y-3">
              {recent.length === 0 && <p className="text-sm text-muted-foreground">Aucune entrée récente. Créez la première entrée pour voir le flux d'activité.</p>}
              {recent.map((r: any) => (
                <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 text-sm font-semibold text-primary truncate">{r.product.name}</div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">×{r.quantity}</span>
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>{r.date?.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "Date non disponible"}</span>
                      <span className="truncate">{r.sku || "Référence inconnue"}</span>
                    </div>
                  </div>
                  {r.product.image_url && (
                    <img src={r.product.image_url} alt={r.product.name} className="h-11 w-11 rounded-md object-cover" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}