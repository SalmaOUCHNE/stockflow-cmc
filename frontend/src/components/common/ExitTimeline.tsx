import { Check, Clock, FileEdit, Truck, XCircle } from "lucide-react";

type Step = { key: string; label: string; icon: any; date?: string | null };

export default function ExitTimeline({ exit }: { exit: any }) {
  const isRejected = exit.status === "rejetee";
  const order = ["brouillon", "en_attente", "validee", "livree"];
  const currentIdx = order.indexOf(exit.status);

  const steps: Step[] = [
    { key: "en_attente", label: "Demande créée", icon: FileEdit, date: exit.created_at },
    { key: "validee", label: "Validée", icon: Check, date: exit.validated_at },
    { key: "livree", label: "Livrée", icon: Truck, date: exit.status === "livree" ? exit.validated_at : null },
  ];

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Suivi du workflow</div>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const reached = !isRejected && currentIdx >= order.indexOf(s.key);
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-start gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${reached ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className={`text-sm font-medium ${reached ? "" : "text-muted-foreground"}`}>{s.label}</div>
                {s.date && reached && (
                  <div className="text-xs text-muted-foreground">{new Date(s.date).toLocaleString("fr-FR")}</div>
                )}
              </div>
            </div>
          );
        })}
        {isRejected && (
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 bg-destructive text-destructive-foreground">
              <XCircle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-sm font-medium text-destructive">Refusée</div>
              {exit.refusal_comment && <div className="text-xs text-muted-foreground mt-0.5">{exit.refusal_comment}</div>}
            </div>
          </div>
        )}
        {!isRejected && exit.status === "en_attente" && (
          <div className="flex items-start gap-3 opacity-70">
            <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 bg-warning/20 text-warning">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-sm font-medium text-warning">En attente de validation</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}