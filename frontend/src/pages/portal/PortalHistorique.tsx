import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle2, Clock, FileText, MoreHorizontal, ChevronLeft, ChevronRight, Zap, Monitor, Wrench, HardHat } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBons } from "@/services/localStoreAdapter";

const iconFor = (cat: string) => cat === "ELECTRONIQUE" ? Monitor : cat === "OUTILLAGE" ? Wrench : cat === "EPI" ? HardHat : Zap;

export default function PortalHistorique() {
  const [page, setPage] = useState(1);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 4;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const bons = await getBons();
        if (!active) return;
        setDemandes(Array.isArray(bons) ? bons.filter((b) => b.status === "validee" || b.status === "livree") : []);
      } catch (error) {
        console.error('Failed to load historique', error);
        if (active) setDemandes([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const exits = demandes;
  const totalPages = Math.max(1, Math.ceil(exits.length / pageSize));
  const rows = exits.slice((page - 1) * pageSize, page * pageSize);

  const chartData = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    m: ["Jan","Fév","Mar","Avr","Mai","Jui","Jui","Aoû","Sep","Oct","Nov","Déc"][i],
    v: exits.filter((e) => {
      const date = new Date(e.exit_date || e.date_emission || e.created_at || Date.now());
      return date.getMonth() === i;
    }).length,
  })), [exits]);

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-xs text-muted-foreground"><span>Accueil</span> / <span className="text-foreground font-medium">Historique des Attributions</span></div>
          <h1 className="text-3xl font-extrabold mt-1">Archives des Attributions</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">Consultez l'ensemble des équipements et fournitures affectés à votre pôle. Ce registre fait foi pour les inventaires de fin de période.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Exporter (CSV)</Button>
          <Button className="bg-gradient-primary text-primary-foreground"><MoreHorizontal className="mr-2 h-4 w-4" /> Imprimer le registre</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Articles totaux" value={exits.length.toLocaleString('fr-FR')} icon={ClipboardList} tone="primary" />
        <Stat label="Validations 2024" value={exits.length} icon={CheckCircle2} tone="success" />
        <Stat label="Dernier mouvement" value="Il y a 2h" icon={Clock} tone="warning" small />
        <Stat label="Bons de sortie" value={exits.length} icon={FileText} tone="destructive" />
      </div>

      <Card className="mt-6 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Registre Détaillé</h3>
            <p className="text-xs text-muted-foreground">Tendance des sorties sur 12 mois</p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">Filière : Maintenance</Badge>
        </div>
        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--accent))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-3">Date</th><th className="py-3">Article</th><th className="py-3">Quantité</th><th className="py-3">Bon de sortie</th><th className="py-3">Destinataire</th><th className="py-3">Validateur</th><th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">Aucune attribution pour l'instant.</td></tr>
              ) : rows.map((r) => {
                const it = r.items || { id: r.product_id, name: r.product_name, unit: r.unit };
                const I = iconFor(it?.category ?? '');
                return (
                  <tr key={r.id} className="hover:bg-secondary/30">
                    <td className="py-4 font-medium">{r.exit_date ? new Date(r.exit_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center"><I className="h-4 w-4" /></div>
                        <span className="font-medium">{it?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono">{String(r.quantity ?? r.quantite ?? 0).padStart(2, '0')}</td>
                    <td className="py-4">
                      <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[11px]">
                        <FileText className="h-3 w-3 mr-1" /> {r.bon_number ?? r.numero ?? '—'}
                      </Badge>
                    </td>
                    <td className="py-4 text-muted-foreground">{r.destination ?? r.pole_name ?? '—'}</td>
                    <td className="py-4">
                      <div className="text-sm font-medium">{r.validateur_id ? 'Voir détail' : '—'}</div>
                      <div className="text-[11px] text-muted-foreground">{r.validateur_id ? '(Chef Pôle)' : ''}</div>
                    </td>
                    <td className="py-4 text-right"><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="text-xs text-muted-foreground">Affichage de 1–{rows.length} sur {exits.length} attributions</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-3 w-3" /></Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} size="sm" variant={n === page ? 'default' : 'outline'} className={n === page ? 'bg-primary text-primary-foreground' : ''} onClick={() => setPage(n)}>{n}</Button>
            ))}
            {totalPages > 3 && <span className="px-1 text-muted-foreground">…</span>}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value, icon: Icon, tone, small }: any) {
  const map: Record<string, string> = { primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', destructive: 'bg-destructive/10 text-destructive' };
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${map[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1 font-extrabold text-foreground ${small ? 'text-xl' : 'text-3xl'}`}>{value}</div>
    </Card>
  );
}
