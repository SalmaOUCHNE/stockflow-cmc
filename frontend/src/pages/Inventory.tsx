import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClipboardList, Plus, Lock, FileDown, Inbox, ArrowLeft, Save, Trash2, Target, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { closeInventorySessionLocal, createInventorySessionLocal, getInventorySessions, updateInventoryLineLocal, deleteInventorySessionLocal, withLookups, getInventoryById, getPoles, getFilieres, getProducts } from "@/services/localStoreAdapter";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ouverte: { label: "Ouverte", cls: "border-primary/40 text-primary" },
  en_cours: { label: "En cours", cls: "border-warning/40 text-warning" },
  cloturee: { label: "Clôturée", cls: "border-muted-foreground/40 text-muted-foreground" },
};

export default function Inventory() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [sessions, setSessions] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({ name: "", pole_id: "", filiere_id: "", notes: "" });

  const load = async () => {
    try {
      const sessionsData = await getInventorySessions();
      const listData = Array.isArray(sessionsData) ? sessionsData : sessionsData?.inventory_sessions ?? sessionsData?.data ?? [];
      setSessions(listData.map(withLookups).sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? "")));
    } catch (error) {
      console.error('[INVENTORY] Failed to load inventory sessions', error);
      setSessions(db.inventory_sessions.map(withLookups).sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? "")));
    }
  };
  useEffect(() => {
    void load();
    (async () => {
      try {
        const [polesData, filieresData] = await Promise.all([getPoles(), getFilieres()]);
        setPoles(Array.isArray(polesData) ? polesData.sort((a, b) => a.name.localeCompare(b.name)) : []);
        setFilieres(Array.isArray(filieresData) ? filieresData.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } catch (e) { console.warn('Failed to load reference data', e); setPoles([]); setFilieres([]); }
    })();
  }, []);

  const createSession = async () => {
    if (!form.name.trim()) return toast.error("Donnez un nom à la session");
    setCreateLoading(true);
    try {
      await createInventorySessionLocal({ ...form, created_by: user?.id ?? null });
      toast.success("Session d'inventaire créée");
      setCreateOpen(false);
      setForm({ name: "", pole_id: "", filiere_id: "", notes: "" });
      await load();
    } catch (error) {
      console.error('[INVENTORY] create session failed', error);
      toast.error("Erreur lors de la création de la session");
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteSession = async () => {
    if (!deleteSessionId) return;
    setDeleteLoading(true);
    try {
      await deleteInventorySessionLocal(deleteSessionId);
      toast.success("Session supprimée");
      await load();
    } catch (error) {
      console.error('[INVENTORY] delete session failed', error);
      toast.error("Erreur lors de la suppression de la session");
    } finally {
      setDeleteLoading(false);
      setDeleteSessionId(null);
    }
  };

  if (activeId) return <SessionDetail id={activeId} onBack={() => { setActiveId(null); load(); }} isAdmin={isAdmin} />;

  return (
    <>
      <PageHeader
        title="Inventaire périodique"
        subtitle="Sessions de comptage physique avec comparaison théorique vs réel et calcul des écarts."
        actions={isAdmin && <Button onClick={() => setCreateOpen(true)} className="bg-primary"><Plus className="mr-2 h-4 w-4" /> Nouvelle session</Button>}
      />

      <Card className="p-0 shadow-soft overflow-hidden">
        {sessions.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-50" />
            <div className="mt-3 font-medium">Aucune session d'inventaire</div>
            <div className="text-xs mt-1">Créez une session pour démarrer un comptage physique.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
                <th className="py-3 px-4">Session</th>
                <th className="py-3">Périmètre</th>
                <th className="py-3">Statut</th>
                <th className="py-3">Démarrée</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => {
                const cfg = STATUS_LABELS[s.status];
                return (
                  <tr key={s.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => setActiveId(s.id)}>
                    <td className="py-3 px-4 font-semibold">{s.name}</td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {s.pole_nom ?? "Tous pôles"}
                      {s.filiere_nom ? <> · {s.filiere_nom}</> : null}
                    </td>
                    <td className="py-3"><Badge variant="outline" className={cfg.cls}>{cfg.label}</Badge></td>
                    <td className="py-3 text-muted-foreground">{new Date(s.started_at).toLocaleString("fr-FR")}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveId(s.id); }}>Ouvrir</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteSessionId(s.id); setDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Bannière informative "Précision Industrielle" */}
      <Card className="mt-4 p-0 shadow-soft overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent z-0" />
        <div
          className="absolute inset-y-0 right-0 w-1/3 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/warehouse-shelves.jpg')" }}
        />
        <div className="relative z-10 p-6 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Précision Industrielle</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                L'inventaire tournant permet de réduire les erreurs de 35% en moyenne.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3 pt-4">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Fiabilité accrue</div>
                <div className="text-xs text-muted-foreground">Données plus précises pour de meilleures décisions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Optimisation continue</div>
                <div className="text-xs text-muted-foreground">Suivi régulier pour une performance durable</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Gain de temps</div>
                <div className="text-xs text-muted-foreground">Processus automatisés pour plus d'efficacité</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle session d'inventaire</DialogTitle>
            <DialogDescription>Définissez le périmètre. Les articles correspondants seront chargés automatiquement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex. Inventaire trimestriel T2 2026" className="mt-1" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pôle (optionnel)</Label>
                <Select value={form.pole_id} onValueChange={(v) => setForm({ ...form, pole_id: v, filiere_id: "" })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les pôles" /></SelectTrigger>
                  <SelectContent>{poles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Filière (optionnel)</Label>
                <Select value={form.filiere_id} onValueChange={(v) => setForm({ ...form, filiere_id: v })} disabled={!form.pole_id}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.pole_id ? "Toutes" : "Choisir un pôle"} /></SelectTrigger>
                  <SelectContent>{filieres.filter((f) => f.pole_id === form.pole_id).map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={createSession} className="bg-primary">Créer la session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen || Boolean(deleteSessionId)} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteSessionId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la session</DialogTitle>
            <DialogDescription>Voulez-vous vraiment supprimer cette session d'inventaire ? Cette action supprimera toutes les lignes associées.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeleteSessionId(null); }}>Annuler</Button>
            <Button className="text-destructive" onClick={async () => {
              if (!deleteSessionId) return;
              setDeleteLoading(true);
              try {
                await deleteInventorySessionLocal(deleteSessionId);
                toast.success('Session supprimée');
                setDeleteConfirmOpen(false);
                setDeleteSessionId(null);
                await load();
              } catch (e) {
                console.error('Delete failed', e);
                toast.error('Erreur lors de la suppression');
              } finally { setDeleteLoading(false); }
            }}>{deleteLoading ? 'Suppression…' : 'Supprimer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
 
function SessionDetail({ id, onBack, isAdmin }: { id: string; onBack: () => void; isAdmin: boolean }) {
  const [session, setSession] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any>>({});
  const [savingLines, setSavingLines] = useState<Record<string, boolean>>({});
  const [exportLoading, setExportLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const load = async () => {
    try {
      const inventory = await getInventoryById(id);
      setSession(withLookups(inventory));
      const ls = Array.isArray(inventory?.inventory_lines) ? inventory.inventory_lines : inventory?.lines || [];
      setLines(ls);
      const productMap: Record<string, any> = {};
      try {
        const products = await getProducts();
        if (Array.isArray(products)) {
          products.forEach((it: any) => {
            if (it?.id != null) productMap[String(it.id)] = it;
          });
        }
      } catch (e) {
        console.warn('[INVENTORY] failed to load products for session detail', e);
      }
      ls.forEach((line) => {
        const key = String(line.product_id || line.item_id || line.product?.id || '');
        if (!productMap[key] && line.product) {
          productMap[key] = line.product;
        }
      });
      setItems(productMap);
    } catch (e) {
      console.error('[INVENTORY] failed to load session detail', e);
      setSession(null);
      setLines([]);
      setItems({});
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const setPhysical = (lineId: string, value: string) => {
    // prevent negative values
    if (value !== "" && Number(value) < 0) {
      toast.error('La quantité ne peut pas être négative');
      return;
    }
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, physical_qty: value === "" ? null : Number(value) } : l)));
  };
  const setJustif = (lineId: string, value: string) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, justification: value } : l)));
  };
  const saveLine = async (lineOrId: any) => {
    const lineId = typeof lineOrId === 'string' ? lineOrId : lineOrId.id;
    const currentLine = lines.find((l) => l.id === lineId);
    if (!currentLine) return;
    try {
      setSavingLines((s) => ({ ...s, [lineId]: true }));
      await updateInventoryLineLocal(lineId, {
        physical_qty: currentLine.physical_qty,
        justification: currentLine.justification,
        counted_at: currentLine.physical_qty != null ? new Date().toISOString() : null,
      });
      toast.success("Ligne enregistrée");
      await load();
    } catch (error) {
      console.error('[INVENTORY] save line failed', error);
      toast.error("Erreur lors de l'enregistrement de la ligne");
    } finally {
      setSavingLines((s) => ({ ...s, [lineId]: false }));
    }
  };

  const close = async () => {
    setCloseLoading(true);
    try {
      await closeInventorySessionLocal(id);
      toast.success("Session clôturée");
      onBack();
    } catch (e) {
      console.error('[INVENTORY] close session failed', e);
      toast.error("Erreur lors de la clôture de la session");
    } finally {
      setCloseLoading(false);
    }
  };

  const exportCsv = () => {
    setExportLoading(true);
    try {
      const rows = [["Session","Date","Article", "SKU", "Théorique", "Physique", "Écart", "Justification"]];
      lines.forEach((l) => {
        const it = items[l.item_id];
        const gap = (l.physical_qty ?? 0) - l.theoretical_qty;
        const date = l.counted_at ?? new Date().toISOString();
        rows.push([session?.name ?? id, date, it?.name ?? "—", it?.sku ?? "", String(l.theoretical_qty), l.physical_qty ?? "", String(gap), l.justification ?? ""]);
      });
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `inventaire-${session?.name?.replace(/\s+/g, "-") ?? id}.csv`;
      a.click();
    } finally { setExportLoading(false); }
  };

  const isClosed = session?.status === "cloturee";
  const counted = lines.filter((l) => l.physical_qty != null).length;
  const gaps = lines.filter((l) => l.physical_qty != null && Number(l.physical_qty) !== Number(l.theoretical_qty)).length;

  if (!session) return null;

  return (
    <>
      <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer la session d'inventaire</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir clôturer cette session ? Après clôture, aucune modification ne sera possible.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">Cette action est irréversible. Assurez-vous que tous les articles ont été comptés.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseConfirmOpen(false)}>Annuler</Button>
            <Button className="bg-primary" onClick={async () => { setCloseConfirmOpen(false); await close(); }} disabled={closeLoading}>{closeLoading ? 'Clôture…' : 'Confirmer la clôture'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <>
          <PageHeader
            title={session.name}
            subtitle={`${session.poles?.name ?? "Tous pôles"}${session.filieres?.name ? ` · ${session.filieres.name}` : ""}`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
                <Button variant="outline" onClick={exportCsv} disabled={exportLoading}>{exportLoading ? 'Export...' : <><FileDown className="mr-2 h-4 w-4" /> Export CSV</>}</Button>
                {isAdmin && !isClosed && <Button onClick={() => setCloseConfirmOpen(true)} className="bg-primary" disabled={counted !== lines.length || closeLoading}>{closeLoading ? 'Clôture…' : <><Lock className="mr-2 h-4 w-4" /> Clôturer</>}</Button>}
              </div>
            }
          />

          <div className="grid gap-3 md:grid-cols-3 mb-4">
            <Card className="p-4 shadow-soft">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Articles à compter</div>
              <div className="mt-1 text-2xl font-bold">{lines.length}</div>
            </Card>
            <Card className="p-4 shadow-soft">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Comptés</div>
              <div className="mt-1 text-2xl font-bold text-success">{counted}</div>
            </Card>
            <Card className="p-4 shadow-soft">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avec écart</div>
              <div className="mt-1 text-2xl font-bold text-destructive">{gaps}</div>
            </Card>
          </div>

          <Card className="p-0 shadow-soft overflow-hidden">
            {lines.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" />
                <div className="mt-2 font-medium text-sm">Aucun article dans le périmètre</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
                    <th className="py-3 px-4">Article</th>
                    <th className="py-3">Théorique</th>
                    <th className="py-3 w-32">Physique</th>
                    <th className="py-3 w-24">Écart</th>
                    <th className="py-3 w-72">Justification</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((l) => {
                    const it = items[l.item_id];
                    const gap = l.physical_qty != null ? Number(l.physical_qty) - Number(l.theoretical_qty) : null;
                    return (
                      <tr key={l.id} className="hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          <div className="font-medium">{it?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono">{it?.sku ?? ""}</div>
                        </td>
                        <td className="py-3 font-mono">{l.theoretical_qty} {it?.unit}</td>
                        <td className="py-3">
                          <Input
                            type="number"
                                  min={0}
                                  value={l.physical_qty ?? ""}
                                  disabled={isClosed}
                                  onChange={(e) => setPhysical(l.id, e.target.value)}
                                  onBlur={() => saveLine(l)}
                                  className="h-8"
                                />
                        </td>
                        <td className="py-3 font-mono">
                          {gap == null ? "—" : (
                            <span className={gap === 0 ? "text-success" : gap > 0 ? "text-primary" : "text-destructive"}>
                              {gap > 0 ? "+" : ""}{gap}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <Input
                            value={l.justification ?? ""}
                            disabled={isClosed}
                            onChange={(e) => setJustif(l.id, e.target.value)}
                            onBlur={() => saveLine(l)}
                            placeholder={gap && gap !== 0 ? "Expliquer l'écart…" : "—"}
                            className="h-8"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          {!isClosed && (
                            <Button size="sm" variant="ghost" onClick={() => saveLine(l)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </>
    </>
  );
}
