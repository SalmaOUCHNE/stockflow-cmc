import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Printer, Download, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createStockExitLocal, getProducts, getPoles, getFilieres } from "@/services/localStoreAdapter";
import logoCmc from "@/assets/logo-cmc.png";
import logoOfppt from "@/assets/logo-ofppt.png";

export default function Exits() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Fit-to-screen: compute scale based on wrapper width vs content width
  useEffect(() => {
    const compute = () => {
      const wrap = wrapperRef.current;
      const content = printRef.current;
      if (!wrap || !content) return setScale(1);
      const wrapW = wrap.clientWidth;
      const contentW = content.offsetWidth;
      const newScale = wrapW < contentW ? Math.max(0.4, wrapW / contentW) : 1;
      setScale(newScale);
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, []);

  const [form, setForm] = useState<any>({
    item_id: "", quantity: 1, requester_name: "", filiere_id: "", pole_id: "",
    exit_date: new Date().toISOString().slice(0, 10), notes: "", supplier: "", local: "",
    bon_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [itemsData, polesData, filieresData] = await Promise.all([getProducts(), getPoles(), getFilieres()]);
        setItems(Array.isArray(itemsData) ? itemsData.sort((a, b) => a.name.localeCompare(b.name)) : []);
        setPoles(Array.isArray(polesData) ? polesData.sort((a, b) => a.name.localeCompare(b.name)) : []);
        setFilieres(Array.isArray(filieresData) ? filieresData.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } catch (e) {
        console.warn('Failed to load exits reference data', e);
        setItems([]);
        setPoles([]);
        setFilieres([]);
      }
    })();
  }, []);

  const selected = useMemo(() => items.find(i => i.id === form.item_id), [items, form.item_id]);
  const selFiliere = filieres.find(f => f.id === form.filiere_id);
  const selPole = poles.find(p => p.id === form.pole_id);
  const filieresForPole = filieres.filter(f => f.pole_id === form.pole_id);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.item_id) {
      setFormError("Choisissez un article");
      return;
    }
    if (form.quantity < 1) {
      setFormError("Quantité invalide");
      return;
    }
    if (selected && form.quantity > selected.quantity) {
      setFormError("Quantité supérieure au stock disponible");
      return;
    }
    setFormError(null);
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        item_id: form.item_id,
        quantity: form.quantity,
        requester_name: form.requester_name,
        filiere_id: form.filiere_id || null,
        pole_id: form.pole_id || null,
        exit_date: form.exit_date,
        notes: form.notes,
        bon_number: form.bon_number || null,
        user_id: user!.id,
      };
      await createStockExitLocal(payload);
      toast.success("Sortie enregistrée et bon de sortie généré");
      setConfirmOpen(false);
      setForm({
        item_id: "",
        quantity: 1,
        requester_name: "",
        filiere_id: "",
        pole_id: "",
        exit_date: new Date().toISOString().slice(0, 10),
        notes: "",
        supplier: "",
        local: "",
        bon_number: "",
      });
      const products = await getProducts();
      setItems(Array.isArray(products) ? products.sort((a, b) => a.name.localeCompare(b.name)) : []);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stockExitCreated", { detail: { productId: payload.item_id } }));
        window.dispatchEvent(new CustomEvent("stockMovementCreated", { detail: { productId: payload.item_id } }));
      }
    } catch (error) {
      console.error('[EXITS] create exit failed', error);
      toast.error("Erreur lors de l'enregistrement de la sortie");
    } finally {
      setSubmitting(false);
    }
  };

  const printDoc = () => window.print();
  const downloadHtml = async () => {
    // Dynamically load html2pdf from CDN and generate a professional A4 PDF
    try {
      if (!printRef.current) return;
      // load script if not present
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load html2pdf'));
          document.head.appendChild(s);
        });
      }

      const element = printRef.current;
      // Clone element to avoid scaling transform affecting PDF
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.transform = '';

      // Inline images where possible to avoid CORS issues and ensure they're embedded in the PDF
      async function inlineImages(root: HTMLElement) {
        const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
        await Promise.all(imgs.map(async (img) => {
          try {
            const src = img.src;
            if (!src) return;
            // Skip data URLs
            if (src.startsWith('data:')) return;
            const resp = await fetch(src, { mode: 'cors' });
            if (!resp.ok) throw new Error('fetch failed');
            const blob = await resp.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((res, rej) => {
              reader.onload = () => res(String(reader.result));
              reader.onerror = () => rej(new Error('reader error'));
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch (e) {
            // If inlining fails, leave the img.src as-is (html2canvas may still render it if CORS allows)
            console.warn('[EXITS][PDF] inline image failed for', img.src, e);
          }
        }));
      }

      await inlineImages(clone);

      // Ensure printable wrapper matches A4 with margins
      const wrapper = document.createElement('div');
      wrapper.style.width = '210mm';
      wrapper.style.minHeight = '297mm';
      wrapper.style.padding = '14mm';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.background = '#ffffff';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // wait a tick for layout and images
      await new Promise((r) => setTimeout(r, 300));

      const dateStr = new Date().toISOString().slice(0,10);
      const safeNum = (form.bon_number || 'UNKNOWN').replace(/[^a-zA-Z0-9-_\.]/g, '_');
      const filename = `Bon-Sortie-${safeNum}-${dateStr}.pdf`;

      const opt = {
        margin: [14, 10, 14, 10], // top,right,bottom,left in mm
        filename,
        image: { type: 'png', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break', avoid: ['.no-break'] }
      } as any;

      console.log('[EXITS][PDF] generating', filename);
      await (window as any).html2pdf().set(opt).from(wrapper).save();
      document.body.removeChild(wrapper);
      toast.success('PDF généré');
    } catch (err) {
      console.error('[EXITS][PDF]', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const ROWS = 30;
  const rows = Array.from({ length: ROWS }).map((_, idx) => {
    if (idx === 0 && selected) {
      return { n: 1, lj: "", code: selected.sku ?? "", desig: selected.name, qte: form.quantity, um: selected.unit };
    }
    return { n: idx + 1, lj: "", code: "", desig: "", qte: "", um: "" };
  });

  return (
    <>
      <PageHeader title="Nouvelle sortie de stock" subtitle="Enregistrez une sortie depuis l'entrepôt et générez le bon officiel." />
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,40%)_minmax(0,60%)] print:block">
        <Card className="p-6 shadow-soft print:hidden h-fit">
          <h2 className="text-xl font-bold text-primary">Détails de la sortie</h2>
          <p className="text-sm text-muted-foreground">Saisissez les informations du bon de sortie.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="N° du bon">
              <Input value={form.bon_number} onChange={e => setForm({ ...form, bon_number: e.target.value })} placeholder="ex. 2026-BS-0001" />
            </Field>
            <Field label="Date de sortie *">
              <Input type="date" value={form.exit_date} onChange={e => setForm({ ...form, exit_date: e.target.value })} required />
            </Field>
            <Field label="Pôle métier *">
              <Select value={form.pole_id} onValueChange={v => setForm({ ...form, pole_id: v, filiere_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un pôle" /></SelectTrigger>
                <SelectContent>{poles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Filière">
              <Select value={form.filiere_id} onValueChange={v => setForm({ ...form, filiere_id: v })} disabled={!form.pole_id}>
                <SelectTrigger><SelectValue placeholder={form.pole_id ? "Sélectionner une filière" : "Choisir un pôle d'abord"} /></SelectTrigger>
                <SelectContent>{filieresForPole.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Frs / Source">
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Fournisseur ou source" />
            </Field>
            <Field label="Local">
              <Input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} placeholder="ex. Atelier, salle…" />
            </Field>
            <div className="border-t border-border pt-4">
              <Field label="Article *">
                <Select value={form.item_id} onValueChange={v => setForm({ ...form, item_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir un article…" /></SelectTrigger>
                  <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <Field label="Quantité *"><Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} required /></Field>
                <Field label="Bénéficiaire"><Input value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} placeholder="Nom & prénom" /></Field>
              </div>
            </div>
            <Field label="Notes (optionnel)">
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="min-h-[60px]" />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full bg-primary h-11"><CheckCircle2 className="mr-2 h-4 w-4" /> Valider la sortie</Button>

            {selected && form.quantity >= selected.quantity - selected.min_threshold && (
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="h-4 w-4" /> Alerte d'inventaire</div>
                <p className="mt-1 text-muted-foreground">« {selected.name} » : stock {selected.quantity} {selected.unit}, seuil {selected.min_threshold}.</p>
              </div>
            )}
            {formError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}
          </form>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirmer la sortie de stock</DialogTitle>
              <DialogDescription>Vérifiez les détails avant de générer le bon de sortie.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">Article</div>
                  <div className="font-medium">{selected?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Quantité</div>
                  <div className="font-medium">{form.quantity} {selected?.unit}</div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">Pôle</div>
                  <div className="font-medium">{selPole?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Filière</div>
                  <div className="font-medium">{selFiliere?.name ?? "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Local / Destination</div>
                <div className="font-medium">{form.local || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bénéficiaire</div>
                <div className="font-medium">{form.requester_name || "—"}</div>
              </div>
              {form.notes && (
                <div>
                  <div className="text-muted-foreground">Notes</div>
                  <div className="font-medium">{form.notes}</div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Button>
              <Button onClick={confirmSubmit} disabled={submitting} className="bg-primary">Confirmer la sortie</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bon de sortie A4 — modèle officiel OFPPT/CMC (responsive preview + fit-to-screen) */}
        <Card className="p-0 shadow-soft overflow-hidden">
          <div ref={wrapperRef} className="w-full max-w-full overflow-x-auto">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '100%' }}>
              <div ref={printRef} className="bg-white text-slate-900 mx-auto" style={{ width: "210mm", minHeight: "297mm", padding: "14mm", maxWidth: '100%' }}>
                {/* En-tête */}
                <div className="grid grid-cols-[80px_1fr_80px] items-center gap-4">
                  <img src={logoOfppt} alt="OFPPT" className="h-16 w-16 object-contain justify-self-start" />
                  <div className="text-center">
                    <div className="text-[22px] font-bold tracking-wide">CMC CASABLANCA-SETTAT</div>
                    <div className="mt-2 inline-block border border-slate-400 px-4 py-1 text-sm font-semibold">Bon de Sortie Magasin</div>
                  </div>
                  <img src={logoCmc} alt="CMC" className="h-16 w-16 object-contain justify-self-end" />
                </div>

                {/* Méta infos */}
                <div className="mt-6 space-y-1 text-[13px]">
                  <MetaRow label="Date" value={form.exit_date ? new Date(form.exit_date).toLocaleDateString("fr-FR") : ""} />
                  <MetaRow label="Pôle" value={selPole?.name ?? ""} />
                  <MetaRow label="Frs / Source" value={form.supplier ?? ""} />
                  <MetaRow label="Local" value={form.local ?? ""} />
                  {selFiliere && <MetaRow label="Filière" value={selFiliere.name} />}
                </div>

                {/* Tableau */}
                <table className="w-full mt-5 text-[12px] border border-slate-700" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="bg-white">
                      <Th w="36px">N°</Th>
                      <Th w="60px">LJ</Th>
                      <Th w="120px">ARTICLE/ITEM</Th>
                      <Th>DESIGNATION</Th>
                      <Th w="70px">QTE</Th>
                      <Th w="60px">UM</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={{ height: "20px" }}>
                        <Td center>{r.n}</Td>
                        <Td>{r.lj}</Td>
                        <Td>{r.code}</Td>
                        <Td className="font-medium">{r.desig}</Td>
                        <Td center>{r.qte !== "" ? String(r.qte).padStart(2, "0") : ""}</Td>
                        <Td center className="uppercase">{r.um}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-10 grid grid-cols-2 gap-12 text-[13px]">
                  <div className="text-center">
                    <div className="font-bold mb-12">Bénéficiaire</div>
                    <div className="border-t border-slate-400 pt-1 text-slate-600">{form.requester_name || "—"}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold mb-12">Gestionnaire de magasin</div>
                    <div className="border-t border-slate-400 pt-1 text-slate-600">—</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 p-3 bg-secondary/40 print:hidden border-t border-border">
            <Button onClick={printDoc} size="sm" className="bg-primary"><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            <Button onClick={downloadHtml} size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Télécharger</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold w-28">{label} :</span>
      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">{value || "\u00A0"}</span>
    </div>
  );
}

function Th({ children, w }: any) {
  return <th style={{ width: w, border: "1px solid #334155", padding: "4px 6px", background: "#f8fafc" }} className="text-[11px] font-bold uppercase">{children}</th>;
}
function Td({ children, center, className = "" }: any) {
  return <td style={{ border: "1px solid #334155", padding: "2px 6px" }} className={`${center ? "text-center" : ""} ${className}`}>{children || "\u00A0"}</td>;
}
