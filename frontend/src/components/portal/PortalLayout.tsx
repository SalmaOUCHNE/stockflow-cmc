import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ShoppingCart, ClipboardList, History, Bell, User as UserIcon,
  Search, Plus, Settings, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logoCmc from "@/assets/logo-cmc.png";

const nav = [
  { to: "/portal/dashboard",        label: "Tableau de bord",       icon: LayoutDashboard },
  { to: "/portal/catalogue",        label: "Catalogue des articles", icon: BookOpen },
  { to: "/portal/nouvelle-demande", label: "Nouvelle demande",       icon: ShoppingCart },
  { to: "/portal/mes-demandes",     label: "Mes demandes",           icon: ClipboardList },
  { to: "/portal/historique",       label: "Historique des attributions", icon: History },
  { to: "/portal/notifications",    label: "Notifications",          icon: Bell },
];

export default function PortalLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const initials = (profile?.full_name ?? profile?.email ?? "?").slice(0, 2).toUpperCase();

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
        <img src={logoCmc} alt="CMC logo" className="h-10 w-auto object-contain" />
        <div className="leading-tight">
          <div className="font-bold text-base text-primary">StockFlow CMC</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Portail Utilisateur</div>
        </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-primary/10 to-accent/5 text-primary shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-gradient-primary" />}
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/portal/profil")}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left leading-tight min-w-0">
            <div className="text-sm font-semibold truncate">{profile?.full_name ?? "Utilisateur"}</div>
            <div className="text-[11px] text-muted-foreground truncate">{profile?.fonction ?? "Standard User"}</div>
          </div>
        </button>
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
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article ou une demande…"
                className="pl-9 bg-secondary/50 border-input rounded-lg"
                onFocus={() => navigate("/portal/catalogue")}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/notifications")} className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/profil")}>
              <Settings className="h-5 w-5" />
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-sm font-semibold">{profile?.full_name ?? "Utilisateur"}</div>
                <div className="text-[11px] text-muted-foreground">Employé CMC</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={async () => { console.log('[LOGOUT] clicked (PortalLayout)'); await signOut(); }}>
              Déconnexion
            </Button>
          </header>
          <main className="p-4 lg:p-8 animate-fade-in">
            <Outlet />
          </main>

          {/* Floating action button */}
          {!location.pathname.includes("nouvelle-demande") && (
            <button
              onClick={() => navigate("/portal/nouvelle-demande")}
              className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-all flex items-center justify-center"
              title="Nouvelle demande"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}