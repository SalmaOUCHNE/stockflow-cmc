import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

export function getExpiryStatus(date?: string | null) {
  if (!date) return null;
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return { tone: "expired", label: "Expiré", days } as const;
  if (days <= 30) return { tone: "soon", label: `Expire dans ${days} j`, days } as const;
  return { tone: "valid", label: `Valide (${days} j)`, days } as const;
}

export default function ExpiryBadge({ date, compact }: { date?: string | null; compact?: boolean }) {
  const s = getExpiryStatus(date);
  if (!s) return <span className="text-muted-foreground text-xs">—</span>;
  const cls =
    s.tone === "expired"
      ? "border-destructive/40 text-destructive bg-destructive/5"
      : s.tone === "soon"
      ? "border-warning/40 text-warning bg-warning/5"
      : "border-success/40 text-success bg-success/5";
  const Icon = s.tone === "valid" ? CheckCircle2 : s.tone === "soon" ? Calendar : AlertTriangle;
  return (
    <Badge variant="outline" className={`${cls} gap-1`}>
      <Icon className="h-3 w-3" />
      {compact ? s.label.split(" ")[0] : s.label}
    </Badge>
  );
}