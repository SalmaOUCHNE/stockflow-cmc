import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, History, Save, AlertTriangle, Printer, Trash2, QrCode, CalendarDays, CheckCircle2, Circle, Package, MapPin } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { expiryInfo } from "@/lib/expiry";
import { deleteItemLocal, getItem, getRecentMovements, saveItemLocal, uploadProductPhoto, getPoles, getFilieres, getCategories } from "@/services/localStoreAdapter";

// ─── Logistics Hub ────────────────────────────────────────────────────────────
const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4, 5];

function LogisticsHub({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value?.trim().toUpperCase() ?? "";

  const cellKey = (row: string, col: number) => `${row}${col}`;

  const handleClick = (row: string, col: number) => {
    const key = cellKey(row, col);
    onChange(key === selected ? "" : key);
  };

  return (
    <div className="space-y-3">
      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS.length}, minmax(0,1fr))` }}>
          {ROWS.map(row =>
            COLS.map(col => {
              const key = cellKey(row, col);
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleClick(row, col)}
                  className={[
                    "relative flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold border transition-all duration-150",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-secondary text-muted-foreground border-border hover:bg-primary/10 hover:border-primary/40 hover:text-primary hover:scale-105",
                  ].join(" ")}
                  aria-label={`Emplacement ${key}`}
                  aria-pressed={isSelected}
                >
                  {key}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected location label */}
      <div className="flex items-center gap-2 min-h-[22px]">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
        {selected ? (
          <span className="text-sm font-medium text-primary">Entrepôt IT — Ray. {selected}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Aucun emplacement sélectionné</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
          Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-secondary border border-border" />
          Disponible
        </span>
      </div>
    </div>
  );
}

// ─── Completion indicator ─────────────────────────────────────────────────────
function completionGroups(item: any, categories: any[]) {
  return [
    {
      label: "Informations générales",
      done: Boolean(item.name?.trim() && item.category_id),
    },
    {
      label: "Stock",
      done: item.quantity > 0 && item.min_threshold >= 0 && Boolean(item.location?.trim()),
    },
    {
      label: "Achat & expiration",
      done: Boolean(item.supplier?.trim() || item.price > 0),
    },
  ];
}

function CompletionBar({ item, categories }: { item: any; categories: any[] }) {
  const groups = completionGroups(item, categories);
  const pct = Math.round((groups.filter(g => g.done).length / groups.length) * 100);

  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Complétion du formulaire</span>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {groups.map(g => (
          <span key={g.label} className={`flex items-center gap-1.5 text-xs font-medium ${g.done ? "text-success" : "text-muted-foreground"}`}>
            {g.done
              ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              : <Circle className="h-3.5 w-3.5" />}
            {g.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function ValidationMsg({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> {message}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();

  const [item, setItem] = useState<any>({
    id: null, reference: '', code_article: '', name: '', sku: '', description: '',
    category_id: '', category: '', unit: 'pièce', quantity: 0, min_threshold: 0,
    max_capacity: 0, location: '', filiere_id: null, pole_id: null, price: 0,
    supplier: '', image_url: '', expires_at: null, purchase_date: null, qr_code: null,
  });

  const [filieres, setFilieres] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const [polesData, filieresData, categoriesData] = await Promise.all([getPoles(), getFilieres(), getCategories()]);
        setPoles(Array.isArray(polesData) ? polesData : []);
        setFilieres(Array.isArray(filieresData) ? filieresData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (e) {
        console.warn('Failed to load reference lists', e);
        setPoles([]); setFilieres([]); setCategories([]);
      }

      if (!isNew) {
        const found = await getItem(id!);
        if (found) {
          setItem({
            ...found,
            category_id: found.category_id ?? found.category ?? '',
            category: found.category ?? '',
            location: found.location ?? found.emplacement ?? '',
            description: found.description ?? '',
            sku: found.sku ?? found.reference ?? '',
            image_url: found.image_url ?? found.photo_url ?? '',
          });
        }
        const movementsData = await getRecentMovements();
        const filteredMovements = Array.isArray(movementsData)
          ? movementsData
              .filter((m: any) => String(m.product_id) === String(id) || String(m.item_id) === String(id))
              .map((m: any) => ({
                ...m,
                type: String(m.type || '').toLowerCase().includes('sortie') || String(m.type || '').toLowerCase().includes('exit') ? 'exit' : 'entry',
              }))
              .sort((a: any, b: any) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
          : [];
        setMovements(filteredMovements);
      }
    })();
  }, [id, isNew]);

  const setField = (key: string, value: any) => {
    setItem((prev: any) => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  const save = async () => {
    // Mark all required fields as touched to show validation
    setTouched({ name: true, category_id: true, location: true });
    if (!item.name?.trim()) { toast.error("Le nom de l'article est requis."); return; }

    setSaving(true);
    try {
      const itemPayload = { ...item };
      if (selectedImageFile) delete itemPayload.image_url;
      const saved = await saveItemLocal(itemPayload);

      if (selectedImageFile && saved?.id) {
        try {
          const uploaded = await uploadProductPhoto(saved.id, selectedImageFile, imageFileName || undefined);
          const photoUrl = uploaded?.photo_url ?? uploaded?.image_url ?? uploaded?.photoUrl;
          if (photoUrl) {
            setItem((prev: any) => ({ ...prev, image_url: photoUrl }));
            setImageData(null); setSelectedImageFile(null);
          }
          toast.success('Image envoyée');
        } catch {
          toast.error("Échec de l'envoi de l'image");
        }
      }

      if (isNew) { toast.success("Article créé"); navigate(`/stock/${saved.id}`); }
      else toast.success("Modifications enregistrées");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Supprimer définitivement cet article ?")) return;
    deleteItemLocal(id!);
    toast.success("Article supprimé");
    navigate("/stock");
  };

  const printQr = () => {
    const w = window.open("", "_blank", "width=420,height=520");
    if (!w) return;
    const svg = document.getElementById("item-qr")?.outerHTML ?? "";
    const titleLabel = item.sku ?? item.reference ?? item.name ?? '';
    w.document.write(`<html><head><title>QR ${titleLabel}</title></head><body style="font-family:system-ui;text-align:center;padding:24px">
      <h2 style="margin:0 0 4px">${item.name ?? item.reference ?? ''}</h2>
      <div style="color:#666;margin-bottom:16px;font-family:monospace">${item.sku ?? item.reference ?? ''}</div>
      ${svg}
      <div style="margin-top:12px;color:#666;font-size:12px">${item.location ?? ''}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 200);
  };

  const critical = !isNew && (item.quantity ?? 0) <= (item.min_threshold ?? 0);
  const capacity = (item.max_capacity ?? 0) > 0 ? Math.min(100, Math.round(((item.quantity ?? 0) / (item.max_capacity ?? 1)) * 100)) : 0;

  const usage = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return { d: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), entry: 0, exit: 0 };
    });
    movements.forEach((movement: any) => {
      const dateKey = new Date(movement.date || movement.date_mouvement || movement.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const bucket = days.find((d) => d.d === dateKey);
      if (!bucket) return;
      if (movement.type === 'entry') bucket.entry += Number(movement.quantity ?? 0);
      else bucket.exit += Number(movement.quantity ?? 0);
    });
    return days;
  }, [movements]);

  const exp = expiryInfo(item.expires_at);
  const previewImage = imageData || item.image_url;
  const qrPayload = typeof window !== "undefined" ? `${window.location.origin}/catalogue/${id ?? ""}` : (id ?? "");

  // Category label helper
  const categoryLabel = useMemo(() => {
    if (!item.category_id) return null;
    const found = categories.find(c => c.id === item.category_id);
    return found?.name ?? item.category_id;
  }, [item.category_id, categories]);

  const poleLabel = useMemo(() => poles.find(p => p.id === item.pole_id)?.name ?? null, [item.pole_id, poles]);
  const filiereLabel = useMemo(() => filieres.find(f => f.id === item.filiere_id)?.name ?? null, [item.filiere_id, filieres]);

  return (
    <>
      <PageHeader
        title={isNew ? "Nouvel article" : "Modifier l'article"}
        subtitle="Configurez les paramètres pour un suivi précis de l'inventaire."
        actions={<Button variant="outline" asChild><Link to="/stock"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au stock</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left/Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Completion bar — only for new items */}
          {isNew && <CompletionBar item={item} categories={categories} />}

          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary">Détails de l'article</h2>
                <p className="text-sm text-muted-foreground">Configurez les paramètres pour un suivi précis.</p>
              </div>
              {!isNew && <Badge variant="outline" className="border-primary/40 text-primary">{item.quantity > 0 ? "En stock" : "Rupture"}</Badge>}
            </div>

            <Section title="Informations générales" sub="Données d'identification de base.">
              <Field label="Nom de l'article *">
                <Input
                  value={item.name}
                  onChange={e => setField('name', e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, name: true }))}
                  placeholder="ex. Pompe hydraulique XJ-400"
                  className={touched.name && !item.name?.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <ValidationMsg show={!!(touched.name && !item.name?.trim())} message="Le nom est obligatoire." />
              </Field>
              <Field label="Description">
                <Textarea value={item.description ?? ""} onChange={e => setField('description', e.target.value)} placeholder="Décrivez l'article, son usage ou ses spécifications" className="min-h-[100px]" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU"><Input value={item.sku ?? ""} onChange={e => setField('sku', e.target.value)} placeholder="CMC-XXX-0000" /></Field>
                <Field label="Catégorie *">
                  <Select value={item.category_id ?? ""} onValueChange={v => { setField('category_id', v); setTouched(p => ({ ...p, category_id: true })); }}>
                    <SelectTrigger className={touched.category_id && !item.category_id ? "border-destructive" : ""}><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      )) : (
                        ["Machine", "Outil", "Consommable", "Pièce"].map((label) => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <ValidationMsg show={!!(touched.category_id && !item.category_id)} message="Veuillez sélectionner une catégorie." />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unité de mesure">
                  <Select value={item.unit} onValueChange={v => setField('unit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unités">unités</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Emplacement">
                  <Input
                    value={item.location ?? ""}
                    onChange={e => setField('location', e.target.value.toUpperCase())}
                    placeholder="ex. A1 ou Atelier A, Rangée 4"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pôle métier">
                  <Select value={item.pole_id ?? ""} onValueChange={v => { setField('pole_id', v); setField('filiere_id', null); }}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un pôle" /></SelectTrigger>
                    <SelectContent>{poles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Filière">
                  <Select value={item.filiere_id ?? ""} onValueChange={v => setField('filiere_id', v)} disabled={!item.pole_id}>
                    <SelectTrigger><SelectValue placeholder={item.pole_id ? "Sélectionner une filière" : "Choisir un pôle d'abord"} /></SelectTrigger>
                    <SelectContent>{filieres.filter(f => f.pole_id === item.pole_id).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Niveaux de stock" sub="Gérez les seuils et alertes automatisées.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Qté actuelle"><Input type="number" value={item.quantity} onChange={e => setField('quantity', Number(e.target.value))} /></Field>
                <Field label="Seuil d'alerte">
                  <Input type="number" value={item.min_threshold} onChange={e => setField('min_threshold', Number(e.target.value))} className={critical ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {critical && <p className="mt-1 text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Critique : niveau atteint le seuil.</p>}
                </Field>
                <Field label="Capacité max"><Input type="number" value={item.max_capacity ?? ""} onChange={e => setField('max_capacity', Number(e.target.value))} /></Field>
              </div>
            </Section>

            <Section title="Achat & expiration" sub="Renseignez fournisseur, prix et expiration pour les consommables.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Prix unitaire"><Input type="number" value={item.price ?? 0} onChange={e => setField('price', Number(e.target.value))} /></Field>
                <Field label="Fournisseur"><Input value={item.supplier ?? ""} onChange={e => setField('supplier', e.target.value)} placeholder="ex. Sotic" /></Field>
                <Field label="URL image"><Input value={item.image_url ?? ""} onChange={e => setField('image_url', e.target.value)} placeholder="https://…" /></Field>
                <Field label="Image (jpg, png, webp)">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setSelectedImageFile(f);
                    setImageFileName(f.name);
                    const reader = new FileReader();
                    reader.onload = () => { setImageData(String(reader.result)); };
                    reader.readAsDataURL(f);
                  }} />
                  {previewImage ? (
                    <div className="mt-4 h-40 overflow-hidden rounded-lg border border-border bg-secondary">
                      <img src={previewImage} alt="Aperçu de l'image" className="h-full w-full object-contain" />
                    </div>
                  ) : null}
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date d'achat"><Input type="date" value={item.purchase_date ?? ""} onChange={e => setField('purchase_date', e.target.value)} /></Field>
                <Field label="Date d'expiration">
                  <Input type="date" value={item.expires_at ?? ""} onChange={e => setField('expires_at', e.target.value || null)} />
                  {exp && (
                    <p className={`mt-1 text-xs flex items-center gap-1 ${exp.tone === "danger" ? "text-destructive" : exp.tone === "warning" ? "text-warning" : "text-success"}`}>
                      <CalendarDays className="h-3 w-3" /> {exp.label}
                    </p>
                  )}
                </Field>
              </div>
            </Section>

            {/* ── Logistics Hub ── */}
            <Section title="Logistics Hub" sub="Cliquez une cellule pour sélectionner l'emplacement de stockage.">
              <LogisticsHub
                value={item.location ?? ""}
                onChange={loc => setField('location', loc)}
              />
            </Section>

            <div className="mt-6 flex justify-end gap-3">
              {!isNew && <Button variant="outline" onClick={remove} className="border-destructive/40 text-destructive hover:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</Button>}
              <Button variant="outline" asChild><Link to="/stock">Annuler</Link></Button>
              <Button onClick={save} disabled={saving} className="bg-primary"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
            </div>
          </Card>

          {/* Movement history — existing items only */}
          {!isNew && (
            <Card className="p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4"><History className="h-4 w-4 text-primary" /><h3 className="font-semibold">Chronologie de traçabilité</h3></div>
              <div className="space-y-0">
                {movements.length === 0 && <p className="text-sm text-muted-foreground">Aucun mouvement enregistré.</p>}
                {movements.map((m: any) => (
                  <div key={m.type + m.id} className="relative pl-8 pb-6 border-l-2 border-border last:border-transparent">
                    <div className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${m.type === "entry" ? "bg-primary" : "bg-destructive"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={m.type === "entry" ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}>
                        {m.type === "entry" ? "ENTRÉE" : "SORTIE"}
                      </Badge>
                      <span className="font-mono font-semibold">{m.type === "entry" ? "+" : "−"}{m.quantity} {item.unit}</span>
                      <span className="text-sm text-muted-foreground">
                        {m.type === "entry" ? `Réappro depuis ${m.supplier ?? "—"}` : `Dispatché à ${m.requester_name ?? "—"}`}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">
          {/* QR Code — existing items only */}
          {!isNew && (
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4 text-primary" /> QR Code</div>
                <Button size="sm" variant="outline" onClick={printQr}><Printer className="mr-2 h-3.5 w-3.5" /> Imprimer</Button>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white rounded-lg border border-border">
                  <QRCodeSVG id="item-qr" value={qrPayload} size={160} level="M" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">{item.sku ?? item.reference ?? '—'}</div>
              </div>
            </Card>
          )}

          {/* Live image preview — always shown */}
          <Card className="p-6 shadow-soft">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Aperçu image</div>
            {previewImage ? (
              <img
                src={previewImage}
                alt={item.name || 'Article'}
                className="w-full rounded-lg border border-border object-contain bg-secondary max-h-48"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/50 py-10 text-muted-foreground">
                <Package className="h-8 w-8 opacity-40" />
                <span className="text-xs text-center">Aucune image sélectionnée.<br />Ajoutez une URL ou uploadez un fichier.</span>
              </div>
            )}
          </Card>

          {/* Live article preview card — always shown */}
          <Card className="p-6 shadow-soft">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Aperçu de l'article</div>
            <dl className="space-y-2.5 text-sm">
              <Row label="Nom">
                <span className={item.name ? "font-medium" : "text-muted-foreground italic"}>
                  {item.name || "—"}
                </span>
              </Row>
              <Row label="SKU">
                <span className="font-mono text-xs">{item.sku || "—"}</span>
              </Row>
              <Row label="Catégorie">
                {categoryLabel
                  ? <Badge variant="outline" className="border-primary/30 text-primary text-xs">{categoryLabel}</Badge>
                  : <span className="text-muted-foreground italic">—</span>}
              </Row>
              <Row label="Unité">
                <span>{item.unit || "—"}</span>
              </Row>
              <Row label="Pôle">
                <span>{poleLabel ?? <span className="text-muted-foreground italic">—</span>}</span>
              </Row>
              <Row label="Filière">
                <span>{filiereLabel ?? <span className="text-muted-foreground italic">—</span>}</span>
              </Row>
            </dl>
          </Card>

          {/* Dynamic stock summary — always shown */}
          <Card className="p-6 shadow-soft">
            <h4 className="font-semibold mb-4">
              {isNew ? "Résumé du stock" : "Paramètres de stock"}
            </h4>
            <dl className="space-y-3 text-sm">
              <Row label="Seuil minimum">
                <Badge variant="outline" className="text-warning border-warning/40">{item.min_threshold} {item.unit}</Badge>
              </Row>
              <Row label="Capacité maximale">
                <span>{item.max_capacity > 0 ? `${item.max_capacity} ${item.unit}` : "—"}</span>
              </Row>
              <Row label="Emplacement">
                <span className={item.location ? "font-medium" : "text-muted-foreground italic"}>
                  {item.location || "—"}
                </span>
              </Row>
              <Row label="Stock initial">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {item.quantity} {item.unit || "pièce"}
                </Badge>
              </Row>
            </dl>
          </Card>

          {/* Stock level card — existing items only */}
          {!isNew && (
            <Card className="p-6 shadow-soft bg-gradient-hero text-primary-foreground">
              <div className="text-[11px] uppercase tracking-wider opacity-70">Solde actuel</div>
              <div className="mt-2 text-5xl font-extrabold">{item.quantity}</div>
              <div className="mt-1 text-sm opacity-80">{item.unit} en stock</div>
              {item.max_capacity > 0 && (
                <>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white" style={{ width: `${capacity}%` }} />
                  </div>
                  <div className="mt-2 text-xs opacity-80">Capacité : {item.max_capacity}</div>
                </>
              )}
            </Card>
          )}

          {/* Usage chart — existing items only */}
          {!isNew && (
            <Card className="p-6 shadow-soft">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Analyse d'usage (7 j)</div>
              <div className="mt-3 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usage}>
                    <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="entry" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="exit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, sub, children }: any) {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div>
          <h3 className="font-bold text-primary">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }: any) {
  return <div><Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>;
}
function Row({ label, children }: any) {
  return <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground shrink-0">{label}</dt><dd className="text-right">{children}</dd></div>;
}