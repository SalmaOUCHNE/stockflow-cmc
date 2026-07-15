import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, MoreVertical, Pencil, Trash2, ShieldCheck, Users as UsersIcon,
  UserCheck, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Clock, Check, X, History,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_OPTIONS, primaryRole, roleLabel, type AppRole } from "@/lib/roleLabels";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { approveUserLocal, createUserLocal, db, deleteUserLocal, getProfile, listUsersWithRoles, rejectUserLocal, updateUserLocal } from "@/services/localStoreAdapter";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  fonction: string | null;
  status: string;
  roles: string[];
};

const PAGE_SIZE = 10;

function splitName(full?: string | null) {
  const f = (full ?? "").trim();
  if (!f) return { prenom: "", nom: "" };
  const parts = f.split(/\s+/);
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}
function joinName(prenom: string, nom: string) {
  return [prenom.trim(), nom.trim()].filter(Boolean).join(" ");
}

export default function Users() {
  const loc = useLocation();
  if (loc.pathname.endsWith("/new")) return <NewUserPage />;
  return <UsersList />;
}

function UsersList() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const users = await listUsersWithRoles();
      const mapped = (users || []).map((u: any) => ({
        id: u.id,
        full_name: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || `${u.nom ?? ''}`,
        email: u.email,
        avatar_url: u.avatar_url || null,
        created_at: u.created_at,
        fonction: u.fonction || null,
        status: u.status ?? (u.is_active ? 'active' : 'inactive'),
        roles: u.role_id ? [u.role_id] : (u.roles || []),
      }));
      setRows(mapped.sort((a: any, b: any) => (b.created_at ?? '').localeCompare(a.created_at ?? '')) as UserRow[]);
    } catch (e) {
      console.error('Failed to load users', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((u) => {
      const role = primaryRole(u.roles);
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.full_name ?? ""} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = rows.length;
    const responsables = rows.filter(u => u.roles.includes("admin")).length;
    const utilisateurs = total - responsables;
    const pending = rows.filter(u => u.status === "pending").length;
    return { total, responsables, utilisateurs, pending };
  }, [rows]);

  const pendingUsers = rows.filter(u => u.status === "pending");

  const setStatus = async (u: UserRow, status: "approved" | "rejected") => {
    try {
      if (status === 'approved') {
        await approveUserLocal(u.id);
      } else {
        await rejectUserLocal(u.id, "Refusé par l'administrateur");
      }
      await logAudit("user.update", { entity_type: "user", entity_id: u.id, new_value: { status } });
      toast.success(status === "approved" ? "Compte approuvé" : "Compte refusé");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Membres de l'équipe, rôles et permissions d'accès à StockFlow CMC."
        actions={
          <Button asChild className="bg-primary">
            <Link to="/users/new"><Plus className="mr-2 h-4 w-4" /> Créer un utilisateur</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total utilisateurs" value={stats.total} icon={UsersIcon} tone="primary" />
        <StatCard label="Responsables magasin" value={stats.responsables} icon={ShieldCheck} tone="primary" />
        <StatCard label="Utilisateurs" value={stats.utilisateurs} icon={UserCheck} tone="muted" />
        <StatCard label="En attente" value={stats.pending} icon={Clock} tone={stats.pending > 0 ? "warning" : "success"} />
      </div>

      {pendingUsers.length > 0 && (
        <Card className="p-5 shadow-soft mb-6 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold">Demandes d'inscription en attente d'approbation</h3>
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10">{pendingUsers.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-card border border-border p-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {(u.full_name ?? u.email ?? "?").slice(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[200px] leading-tight">
                  <div className="font-semibold text-sm">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fonction</div>
                  <div className="font-medium">{u.fonction ?? "—"}</div>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setStatus(u, "rejected")}>
                    <X className="h-4 w-4 mr-1" /> Refuser
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setStatus(u, "approved")}>
                    <Check className="h-4 w-4 mr-1" /> Approuver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <RecentAuditCard />

      <Card className="p-4 shadow-soft mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom, prénom ou email…"
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v: any) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrer par rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3">Email</th>
                <th className="py-3">Fonction</th>
                <th className="py-3">Rôle</th>
                <th className="py-3">Statut</th>
                <th className="py-3">Créé le</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Chargement…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Aucun utilisateur trouvé.</td></tr>
              ) : pageRows.map((u) => {
                const { prenom, nom } = splitName(u.full_name);
                const role = primaryRole(u.roles);
                const initials = (u.full_name || u.email || "?").slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <div className="font-semibold">{nom || "—"}</div>
                          <div className="text-xs text-muted-foreground">{prenom || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">{u.fonction ?? "—"}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={role === "admin" ? "border-primary/40 text-primary bg-primary/5" : ""}>
                        {roleLabel(role)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditing(u)}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={u.id === me?.id}
                            onClick={() => setDeleting(u)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">Page {safePage} / {totalPages}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(); }}
        />
      )}
    </>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "success" | "muted" | "warning" }) {
  const toneCls =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "success" ? "bg-emerald-500/10 text-emerald-600"
    : tone === "warning" ? "bg-amber-500/10 text-amber-600"
    : "bg-secondary text-muted-foreground";
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10">En attente</Badge>;
  if (status === "rejected") return <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/5">Refusé</Badge>;
  if (status === "inactive") return <Badge variant="outline" className="border-muted/40 text-muted-foreground bg-muted/5">Désactivé</Badge>;
  return <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5">Actif</Badge>;
}

function RecentAuditCard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  useEffect(() => {
    const data = db.audit_log.slice(0, 6);
    setLogs(data);
    const m: Record<string, any> = {};
    data.forEach((l: any) => { const p = getProfile(l.user_id); if (p) m[p.id] = p; });
    setProfilesMap(m);
  }, []);
  const summarize = (l: any) => {
    const who = profilesMap[l.user_id]?.full_name ?? profilesMap[l.user_id]?.email ?? "Utilisateur";
    if (l.action === "user.create") return <><strong>{who}</strong> a créé un nouvel utilisateur.</>;
    if (l.action === "user.update" && l.new_value?.status === "approved") return <><strong>{who}</strong> a approuvé un compte.</>;
    if (l.action === "user.update" && l.new_value?.status === "rejected") return <><strong>{who}</strong> a refusé un compte.</>;
    if (l.action === "user.update" && l.new_value?.role) return <><strong>{who}</strong> a modifié le rôle d'un utilisateur en <em>{roleLabel(l.new_value.role)}</em>.</>;
    if (l.action === "user.update") return <><strong>{who}</strong> a modifié un utilisateur.</>;
    if (l.action === "auth.login") return <><strong>{who}</strong> s'est connecté.</>;
    return <><strong>{who}</strong> — {l.action}</>;
  };
  const ago = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "à l'instant";
    if (diff < 60) return `il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.floor(h / 24)} j`;
  };
  return (
    <Card className="p-5 shadow-soft mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-soft">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Historique d'audit</h3>
          <p className="text-xs text-muted-foreground">Dernières modifications du système</p>
          {logs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aucune activité récente.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {logs.map(l => (
                <li key={l.id} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{summarize(l)} <span className="text-xs text-muted-foreground">{ago(l.created_at)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function EditUserDialog({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const init = splitName(user.full_name);
  const [prenom, setPrenom] = useState(init.prenom);
  const [nom, setNom] = useState(init.nom);
  const [role, setRole] = useState<AppRole>(primaryRole(user.roles));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const full_name = joinName(prenom, nom);
      updateUserLocal(user.id, { full_name, role });
      await logAudit("user.update", { entity_type: "user", entity_id: user.id, new_value: { full_name, role } });
      toast.success("Utilisateur mis à jour");
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la mise à jour");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom"><Input value={prenom} onChange={e => setPrenom(e.target.value)} /></Field>
            <Field label="Nom"><Input value={nom} onChange={e => setNom(e.target.value)} /></Field>
          </div>
          <Field label="Rôle">
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button onClick={save} disabled={busy} className="bg-primary">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user, onClose, onDeleted }: { user: UserRow; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      deleteUserLocal(user.id);
      await logAudit("user.update", { entity_type: "user", entity_id: user.id, metadata: { deleted: true } });
      toast.success("Utilisateur supprimé");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message ?? "Suppression impossible");
    } finally { setBusy(false); }
  };
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le compte de <strong>{user.full_name ?? user.email}</strong> et son rôle seront définitivement
            supprimés du système. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); confirm(); }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NewUserPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", role: "internal_user" as AppRole, password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const full_name = joinName(form.prenom, form.nom);
      const created = createUserLocal({ full_name, email: form.email, password: form.password, role: form.role });
      await logAudit("user.create", { entity_type: "user", entity_id: created.id, new_value: { full_name, role: form.role } });
      toast.success("Utilisateur créé en local.");
      nav("/users");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Créer un nouvel utilisateur"
        subtitle="Ajoutez un membre à la gestion d'accès StockFlow CMC."
        actions={<Button variant="outline" asChild><Link to="/users"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste</Link></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-soft">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom"><Input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required /></Field>
              <Field label="Nom"><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></Field>
            </div>
            <Field label="Email professionnel">
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Rôle d'accès">
              <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mot de passe temporaire">
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              <p className="mt-1 text-xs text-muted-foreground">L'utilisateur sera invité à le changer à la première connexion.</p>
            </Field>
            <div className="flex justify-end gap-3">
              <Button asChild variant="outline" type="button"><Link to="/users">Annuler</Link></Button>
              <Button type="submit" disabled={busy} className="bg-primary">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer l'utilisateur
              </Button>
            </div>
          </form>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-bold">Permissions des rôles</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full bg-primary" /> Responsable Magasin</div>
              <p className="mt-1 text-muted-foreground">Accès total : gestion du stock, validation des sorties, rapports, utilisateurs et paramètres.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Utilisateur</div>
              <p className="mt-1 text-muted-foreground">Consultation du stock et création de demandes de sortie.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}