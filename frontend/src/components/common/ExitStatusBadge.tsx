import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Truck, FileEdit } from "lucide-react";

export const EXIT_STATUSES = {
  brouillon: { label: "Brouillon", icon: FileEdit, cls: "border-muted-foreground/30 text-muted-foreground bg-muted/40" },
  en_attente: { label: "En attente", icon: Clock, cls: "border-warning/40 text-warning bg-warning/5" },
  emis: { label: "En attente", icon: Clock, cls: "border-warning/40 text-warning bg-warning/5" },
  validee: { label: "Validée", icon: CheckCircle2, cls: "border-success/40 text-success bg-success/5" },
  rejetee: { label: "Rejetée", icon: XCircle, cls: "border-destructive/40 text-destructive bg-destructive/5" },
  livree: { label: "Livrée", icon: Truck, cls: "border-primary/40 text-primary bg-primary/5" },
} as const;

export type ExitStatus = keyof typeof EXIT_STATUSES;

export default function ExitStatusBadge({ status }: { status: string }) {
  const cfg = EXIT_STATUSES[status as ExitStatus] ?? EXIT_STATUSES.en_attente;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.cls} gap-1`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}