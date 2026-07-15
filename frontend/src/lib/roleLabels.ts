export type AppRole = "admin" | "store_manager" | "internal_user";

// Project decision: 2 effective roles. `admin` is displayed as "Responsable Magasin",
// everything else as "Utilisateur". Mapping is label-only — no DB change.
export const ROLE_LABELS: Record<string, string> = {
  admin: "Responsable Magasin",
  store_manager: "Responsable Magasin",
  internal_user: "Utilisateur",
};

export const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Responsable Magasin" },
  { value: "internal_user", label: "Utilisateur" },
];

export function roleLabel(role?: string | null) {
  if (!role) return "Utilisateur";
  return ROLE_LABELS[role] ?? "Utilisateur";
}

export function primaryRole(roles: string[] = []): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("store_manager")) return "store_manager";
  return "internal_user";
}