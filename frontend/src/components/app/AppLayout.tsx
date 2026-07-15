import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  LogIn as Entry,
  LogOut as Exit,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  Menu,
  X,
  Plus,
  Users,
  FileCheck2,
  ClipboardList,
  History,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoCmc from "@/assets/logo-cmc.png";
import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";

type NavItem = { to: string; label: string; icon: any; adminOnly?: boolean; group?: string };

const nav: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Principal" },
  { to: "/stock", label: "Stock", icon: Package, group: "Opérations" },
  { to: "/entries", label: "Entrées", icon: Entry, group: "Opérations" },
  { to: "/exits", label: "Sorties", icon: Exit, group: "Opérations" },
  { to: "/bons", label: "Bons de sortie", icon: FileCheck2, group: "Opérations" },
  { to: "/inventory", label: "Inventaire", icon: ClipboardList, group: "Opérations" },
  { to: "/expirations", label: "Expirations", icon: CalendarClock, group: "Opérations" },
  { to: "/reports", label: "Rapports", icon: BarChart3, group: "Analyses" },
  { to: "/audit", label: "Journal d'audit", icon: History, adminOnly: true, group: "Administration" },
  { to: "/users", label: "Utilisateurs", icon: Users, adminOnly: true, group: "Administration" },
  { to: "/settings", label: "Paramètres", icon: Settings, group: "Administration" },
];

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  stock: "Stock",
  entries: "Entrées",
  exits: "Sorties",
  bons: "Bons de sortie",
  inventory: "Inventaire",
  expirations: "Expirations",
  reports: "Rapports",
  notifications: "Notifications",
  audit: "Journal d'audit",
  users: "Utilisateurs",
  settings: "Paramètres",
  new: "Nouveau",
};

export default function AppLayout() {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isAdmin = roles.includes("admin");
  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  // Keyboard shortcut for command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleNav = nav.filter((n) => !n.adminOnly || isAdmin);
  const groups = Array.from(new Set(visibleNav.map((n) => n.group ?? "Menu")));

  // Breadcrumb segments
  const segments = location.pathname.split("/").filter(Boolean);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
        <img src={logoCmc} alt="CMC logo" className="h-10 w-auto object-contain" />
        <div className="leading-tight">
          <div className="font-bold text-sidebar-primary">StockFlow CMC</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Casablanca-Settat</div>
        </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {g}
            </div>
            <div className="space-y-0.5">
              {visibleNav
                .filter((n) => (n.group ?? "Menu") === g)
                .map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-primary/10 to-accent/5 text-primary shadow-soft"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:translate-x-0.5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-gradient-primary" />}
                        <Icon className={cn("h-4 w-4 transition-transform", isActive && "text-primary")} />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Button
          onClick={() => navigate("/entries/new")}
          className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95 hover:shadow-glow transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvelle entrée
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden lg:block sticky top-0 h-screen">{sidebar}</div>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 h-full">{sidebar}</div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(o => !o)}>
              {open ? <X /> : <Menu />}
            </Button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="group relative flex-1 max-w-xl flex items-center gap-2 rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Rechercher articles, pages, actions…</span>
              <span className="sm:hidden">Rechercher…</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                Ctrl K
              </kbd>
            </button>
            <NotificationBell />
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" title="Aide"><HelpCircle className="h-5 w-5" /></Button>
            <div className="h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-secondary outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-sm font-semibold">{profile?.full_name ?? "Utilisateur"}</div>
                  <div className="text-[11px] text-muted-foreground">{isAdmin ? "Responsable Magasin" : "Utilisateur"}</div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile?.email ?? "Mon compte"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>Paramètres</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/notifications")}>Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { console.log('[LOGOUT] clicked (AppLayout)'); await signOut(); }}>Se déconnecter</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          {segments.length > 0 && (
            <div className="border-b border-border bg-background/60 px-4 lg:px-8 py-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <NavLink to="/dashboard" className="hover:text-foreground transition-colors">Accueil</NavLink>
              {segments.map((seg, i) => {
                const path = "/" + segments.slice(0, i + 1).join("/");
                const label = ROUTE_LABELS[seg] ?? seg;
                const isLast = i === segments.length - 1;
                return (
                  <span key={path} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 opacity-50" />
                    {isLast ? (
                      <span className="text-foreground font-medium capitalize">{label}</span>
                    ) : (
                      <NavLink to={path} className="hover:text-foreground transition-colors capitalize">{label}</NavLink>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          <main className="p-4 lg:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}