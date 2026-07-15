import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Info, Plus, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { createStockExitLocal, getProducts, getPoles, getFilieres } from "@/services/localStoreAdapter";

const motifs = [
  "Nouveau collaborateur",
  "Renouvellement matériel",
  "Projet ponctuel",
  "Remplacement matériel défectueux",
  "Autre",
];

export default function PortalNouvelleDemande() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const presetItem = sp.get("item") ?? "";

  const [items, setItems] = useState<any[]>([]);
  const [poles, setPoles] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [itemId, setItemId] = useState(presetItem);
  const [qty, setQty] = useState<string>("");
  const [date, setDate] = useState("");
  const [pole, setPole] = useState("");
  const [filiere, setFiliere] = useState("");
  const [motif, setMotif] = useState(motifs[0]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [products, polesData, filieresData] = await Promise.all([getProducts(), getPoles(), getFilieres()]);
        if (!active) return;
        const itemsList = Array.isArray(products) ? products : [];
        const polesList = Array.isArray(polesData) ? polesData : [];
        const filieresList = Array.isArray(filieresData) ? filieresData : [];
        setItems(itemsList);
        setPoles(polesList);
        setFilieres(filieresList);
        if (!pole && polesList.length > 0) setPole(String(polesList[0].id));
        if (!filiere && filieresList.length > 0) setFiliere(String(filieresList[0].id));
      } catch (error) {
        console.error('Failed to load demande resources', error);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const selectedItem = useMemo(() => items.find((i) => String(i.id) === String(itemId)), [items, itemId]);
  const filteredFilieres = useMemo(() => filieres.filter((f) => String(f.pole_id) === String(pole)), [filieres, pole]);

  const submit = async (asDraft: boolean) => {
    if (!itemId || !qty) { toast.error("Article et quantité requis"); return; }
    setBusy(true);
    try {
      const num = `DEM-${Date.now()}`;
      await createStockExitLocal({
        product_id: itemId,
        quantity: Number(qty),
        status: asDraft ? "brouillon" : "en_attente",
        exit_date: date || new Date().toISOString().slice(0, 10),
        bon_number: num,
        requester_name: selectedItem?.name ?? "Demandeur",
        pole_id: pole || null,
        filiere_id: filiere || null,
        notes: comment,
        motive: motif,
      });
      toast.success(asDraft ? "Brouillon enregistré" : "Demande soumise avec succès");
      navigate("/portal/mes-demandes");
    } catch (error: any) {
      console.error('Failed to submit demande', error);
      toast.error(error?.message ?? "Impossible de soumettre la demande");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Nouvelle Demande</h1>
          <div className="mt-1 text-xs text-muted-foreground"><span className="hover:text-foreground cursor-pointer">Tableau de bord</span> / <span className="text-foreground font-medium">Nouvelle Demande</span></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => submit(true)}>Enregistrer en brouillon</Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow" disabled={busy} onClick={() => submit(false)}>Soumettre la demande</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" /> Détails de la demande</div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">À soumettre</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Article sélectionné</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez un article du catalogue…" /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name} — {i.sku ?? i.reference}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quantité demandée</Label>
                <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ex : 1" className="mt-1" />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date souhaitée</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pôle métier</Label>
                <Select value={pole} onValueChange={(v) => { setPole(v); const firstFiliere = filieres.find((x: any) => String(x.pole_id) === String(v)); if (firstFiliere) setFiliere(String(firstFiliere.id)); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {poles.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Filière</Label>
                <Select value={filiere} onValueChange={setFiliere}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {filteredFilieres.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Motif de la demande</Label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{motifs.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Commentaire (Facultatif)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Précisez votre besoin ici…" className="mt-1 min-h-[110px]" />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 shadow-elegant relative overflow-hidden bg-gradient-hero text-primary-foreground">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 font-semibold mb-4"><CheckCircle2 className="h-4 w-4" /> Processus de validation</div>
              <Timeline />
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Résumé de la demande</div>
            <Row label="Article" value={selectedItem?.name ?? <span className="text-muted-foreground">Non sélectionné</span>} />
            <Row label="Quantité" value={qty || "0"} />
            <Row label="Date souhaitée" value={date || "—"} />
            <Row label="Pôle métier" value={poles.find((p) => String(p.id) === String(pole))?.name ?? '—'} />
            <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Les demandes de matériel IT sont généralement traitées sous un délai de 48h ouvrées après approbation managériale.</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function Timeline() {
  const steps = [
    { title: "Initialisation", sub: "Soumission par l'utilisateur", done: true },
    { title: "Approbation Manager", sub: "Validation du Pôle métier", done: false, active: true },
    { title: "Validation Stock", sub: "Vérification disponibilité CMC", done: false },
    { title: "Attribution Finale", sub: "Mise à disposition du matériel", done: false },
  ];
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? 'bg-white text-primary' : s.active ? 'bg-white/30 text-white ring-2 ring-white' : 'bg-white/20 text-white/70'}`}>
            {s.done ? '✓' : i + 1}
          </div>
          <div>
            <div className="font-semibold text-sm">{s.title}</div>
            <div className="text-[11px] text-white/75">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
