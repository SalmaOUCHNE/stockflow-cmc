import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, FileCheck2, CheckCircle2, XCircle, Truck, Eye, Inbox, Plus, Printer, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ExitStatusBadge, { EXIT_STATUSES } from "@/components/common/ExitStatusBadge";
import ExitTimeline from "@/components/common/ExitTimeline";
import { logAudit } from "@/lib/audit";
import { db, getBons, updateStockExitStatusLocal, withLookups } from "@/services/localStoreAdapter";

export default function Bons() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [active, setActive] = useState<any | null>(null);
  const [refusalOpen, setRefusalOpen] = useState(false);
  const [refusalText, setRefusalText] = useState("");

  const load = async () => {
    try {
      const data = await getBons();
      const listData = Array.isArray(data) ? data : data?.bons ?? data?.data ?? [];
      setList(listData.map(withLookups).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")));
    } catch (error) {
      console.error('[BONS] Failed to load bons', error);
      setList(db.stock_exits.map(withLookups).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")));
    }
  };
  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const refreshListener = () => void load();
    window.addEventListener("stockExitCreated", refreshListener);
    window.addEventListener("stockMovementCreated", refreshListener);
    return () => {
      window.removeEventListener("stockExitCreated", refreshListener);
      window.removeEventListener("stockMovementCreated", refreshListener);
    };
  }, []);

  const loadHtml2Pdf = async () => {
    const globalHtml2Pdf = (window as any).html2pdf;
    if (globalHtml2Pdf) return globalHtml2Pdf;
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.14.0/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = (error) => reject(new Error(`Impossible de charger html2pdf: ${error}`));
      document.body.appendChild(script);
    });
  };

  const printBon = (bon: any) => {
    if (!bon) return;
    const html = `
      <html>
        <head>
          <title>Bon de sortie ${bon.bon_number}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; color: #111827; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .header h1 { margin: 0; font-size: 20px; }
            .section { margin-top: 18px; }
            .section-title { font-size: 13px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .field { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-size: 14px; color: #0f172a;">CMC Casablanca-Settat</div>
              <h1>Bon de sortie</h1>
            </div>
            <div style="text-align: right;">
              <div>${bon.bon_number || '—'}</div>
              <div style="font-size: 12px; color: #64748b;">${bon.exit_date ? new Date(bon.exit_date).toLocaleString('fr-FR') : '—'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Détails</div>
            <div class="grid">
              <div class="field"><div class="label">Produit</div><div class="value">${bon.items?.name || '—'}</div></div>
              <div class="field"><div class="label">Quantité</div><div class="value">${bon.quantity ?? '—'} ${bon.items?.unit || ''}</div></div>
              <div class="field"><div class="label">Pôle</div><div class="value">${bon.poles?.name || '—'}</div></div>
              <div class="field"><div class="label">Filière</div><div class="value">${bon.filieres?.name || '—'}</div></div>
              <div class="field"><div class="label">Bénéficiaire</div><div class="value">${bon.requester_name || '—'}</div></div>
              <div class="field"><div class="label">Statut</div><div class="value">${bon.status || '—'}</div></div>
            </div>
          </div>
          ${bon.notes ? `<div class="section"><div class="section-title">Notes</div><div class="field">${bon.notes}</div></div>` : ''}
        </body>
      </html>`;
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportBonPdf = async (bon: any) => {
    if (!bon) return;
    const htmlContent = document.createElement('div');
    htmlContent.style.padding = '24px';
    htmlContent.style.fontFamily = 'Inter, Arial, sans-serif';
    htmlContent.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; color: #111827;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <div style="font-size: 14px; color: #0f172a;">CMC Casablanca-Settat</div>
            <div style="font-size: 28px; font-weight: 700;">Bon de sortie</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 600;">${bon.bon_number || '—'}</div>
            <div style="font-size: 12px; color: #64748b;">${bon.exit_date ? new Date(bon.exit_date).toLocaleString('fr-FR') : '—'}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Produit</strong><div>${bon.items?.name || '—'}</div></div>
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Quantité</strong><div>${bon.quantity ?? '—'} ${bon.items?.unit || ''}</div></div>
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Pôle</strong><div>${bon.poles?.name || '—'}</div></div>
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Filière</strong><div>${bon.filieres?.name || '—'}</div></div>
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Bénéficiaire</strong><div>${bon.requester_name || '—'}</div></div>
          <div style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;"><strong>Statut</strong><div>${bon.status || '—'}</div></div>
        </div>
        ${bon.notes ? `<div style="margin-top: 18px;"><strong>Notes</strong><div style="margin-top: 8px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px;">${bon.notes}</div></div>` : ''}
      </div>`;
    document.body.appendChild(htmlContent);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf().set({
        margin: 10,
        filename: `Bon-Sortie-${bon.bon_number || 'export'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(htmlContent).save();
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error('Erreur lors de l’export PDF');
    } finally {
      document.body.removeChild(htmlContent);
    }
  };

  const filtered = useMemo(
    () =>
      list.filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (search) {
          const hay = `${b.bon_number ?? ""} ${b.items?.name ?? ""} ${b.requester_name ?? ""} ${b.poles?.name ?? ""}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [list, statusFilter, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    list.forEach((b) => (c[b.status] = (c[b.status] ?? 0) + 1));
    return c;
  }, [list]);

  const updateStatus = async (id: string, status: string, refusal_comment?: string) => {
    const before = list.find((x) => x.id === id);
    const payload: any = { status };
    if (refusal_comment) payload.refusal_comment = refusal_comment;
    if (status === "validee") {
      payload.validated_by = user?.id;
      payload.validated_at = new Date().toISOString();
    }
    await updateStockExitStatusLocal(id, status, payload);
    await logAudit(`exit.${status === "validee" ? "validate" : status === "rejetee" ? "reject" : status === "livree" ? "deliver" : "create"}` as any, {
      entity_type: "stock_exit", entity_id: id, old_value: { status: before?.status }, new_value: payload,
    });
    toast.success("Statut mis à jour");
    setRefusalOpen(false); setRefusalText(""); setActive(null);
    load();
  };

  return (
    <>
      <PageHeader
        title="Bons de sortie"
        subtitle="Archive et workflow de validation des bons de sortie magasin (format BSC-AAAA-NNNNN)."
        actions={<Button asChild className="bg-primary"><Link to="/exits"><Plus className="mr-2 h-4 w-4" /> Nouveau bon</Link></Button>}
      />

      <div className="grid gap-3 md:grid-cols-5 mb-6">
        {(["en_attente", "validee", "livree", "rejetee", "brouillon"] as const).map((s) => {
          const cfg = EXIT_STATUSES[s];
          const Icon = cfg.icon;
          return (
            <Card key={s} className="p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{cfg.label}</div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold">{counts[s] ?? 0}</div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 shadow-soft mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher par n° de bon, article, bénéficiaire…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(EXIT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-0 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
              <th className="py-3 px-4">N° Bon</th>
              <th className="py-3">Article</th>
              <th className="py-3">Pôle / Filière</th>
              <th className="py-3">Bénéficiaire</th>
              <th className="py-3">Qté</th>
              <th className="py-3">Date</th>
              <th className="py-3">Statut</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.length === 0 && (
              <tr><td colSpan={8}>
                <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 opacity-50" />
                  <div className="mt-2 font-medium text-sm">Aucun bon de sortie</div>
                </div>
              </td></tr>
            )}
            {pageItems.map((b) => (
              <tr key={b.id} className="hover:bg-secondary/40">
                <td className="py-3 px-4 font-mono font-semibold text-primary">{b.bon_number ?? "—"}</td>
                <td className="py-3">
                  <div className="font-medium">{b.items?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{b.items?.sku ?? ""}</div>
                </td>
                <td className="py-3 text-xs">
                  <div>{b.poles?.name ?? "—"}</div>
                  <div className="text-muted-foreground">{b.filieres?.name ?? ""}</div>
                </td>
                <td className="py-3">{b.requester_name ?? "—"}</td>
                <td className="py-3 font-mono">{b.quantity} {b.items?.unit}</td>
                <td className="py-3 text-muted-foreground">{b.exit_date ? new Date(b.exit_date).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="py-3"><ExitStatusBadge status={b.status} /></td>
                <td className="py-3 pr-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setActive(b)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <div className="text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
              <span className="px-3 py-1.5 text-sm">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!active && !refusalOpen} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  Bon {active.bon_number}
                </DialogTitle>
                <DialogDescription>Détails et workflow de validation</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <ExitTimeline exit={active} />
                <Row label="Statut"><ExitStatusBadge status={active.status} /></Row>
                <Row label="Article">{active.items?.name}</Row>
                <Row label="Quantité"><span className="font-mono font-semibold">{active.quantity} {active.items?.unit}</span></Row>
                <Row label="Pôle">{active.poles?.name ?? "—"}</Row>
                <Row label="Filière">{active.filieres?.name ?? "—"}</Row>
                <Row label="Bénéficiaire">{active.requester_name ?? "—"}</Row>
                {active.local && <Row label="Destination">{active.local}</Row>}
                <Row label="Date de sortie">{active.exit_date ? new Date(active.exit_date).toLocaleDateString("fr-FR") : "—"}</Row>
                {active.notes && <Row label="Notes">{active.notes}</Row>}
                {active.refusal_comment && (
                  <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-3 text-sm">
                    <div className="font-semibold text-destructive">Motif de refus</div>
                    <p className="mt-1">{active.refusal_comment}</p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <>
                  <DialogFooter className="flex flex-wrap gap-2 mt-4">
                    {active.status === "en_attente" && (
                      <>
                        <Button variant="outline" className="border-destructive/40 text-destructive" onClick={() => setRefusalOpen(true)}>
                          <XCircle className="mr-2 h-4 w-4" /> Refuser
                        </Button>
                        <Button onClick={() => updateStatus(active.id, "validee")} className="bg-success text-success-foreground">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
                        </Button>
                      </>
                    )}
                    {active.status === "validee" && (
                      <Button onClick={() => updateStatus(active.id, "livree")} className="bg-primary">
                        <Truck className="mr-2 h-4 w-4" /> Marquer livrée
                      </Button>
                    )}
                  </DialogFooter>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => printBon(active)}>
                      <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportBonPdf(active)}>
                      <Download className="mr-2 h-4 w-4" /> Exporter PDF
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={refusalOpen} onOpenChange={setRefusalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif de refus</DialogTitle>
            <DialogDescription>Indiquez la raison du refus de ce bon de sortie.</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Commentaire *</Label>
            <Textarea value={refusalText} onChange={(e) => setRefusalText(e.target.value)} className="mt-1 min-h-[100px]" placeholder="ex. Stock insuffisant, demande non justifiée…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefusalOpen(false)}>Annuler</Button>
            <Button
              disabled={!refusalText.trim()}
              onClick={() => updateStatus(active!.id, "rejetee", refusalText.trim())}
              className="bg-destructive text-destructive-foreground"
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, children }: any) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}