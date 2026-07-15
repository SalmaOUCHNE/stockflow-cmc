// Expiration helper utilities — used by the stock module and dashboard.
export type ExpiryStatus = "expired" | "soon" | "valid" | null;

export function daysUntilExpiry(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export function expiryStatus(expiresAt?: string | null, soonThreshold = 30): ExpiryStatus {
  const d = daysUntilExpiry(expiresAt);
  if (d == null) return null;
  if (d < 0) return "expired";
  if (d <= soonThreshold) return "soon";
  return "valid";
}

export function expiryInfo(expiresAt?: string | null) {
  const d = daysUntilExpiry(expiresAt);
  if (d == null) return null;
  if (d < 0) return { status: "expired" as const, days: d, label: `Expiré depuis ${Math.abs(d)} j`, tone: "danger" as const };
  if (d <= 30) return { status: "soon" as const,    days: d, label: `Expire dans ${d} j`,             tone: "warning" as const };
  return        { status: "valid" as const,         days: d, label: `Valide (${d} j restants)`,      tone: "success" as const };
}