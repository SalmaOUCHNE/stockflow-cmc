import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  LogIn,
  LogOut,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  FileCheck2,
  Bell,
  History,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/localStoreAdapter";

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setItems(db.items.filter((item) => !item.archived).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50));
    }
  }, [open]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher articles, pages, actions… (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" /> Tableau de bord</CommandItem>
          <CommandItem onSelect={() => go("/stock")}><Package className="mr-2 h-4 w-4" /> Stock</CommandItem>
          <CommandItem onSelect={() => go("/entries")}><LogIn className="mr-2 h-4 w-4" /> Entrées</CommandItem>
          <CommandItem onSelect={() => go("/exits")}><LogOut className="mr-2 h-4 w-4" /> Sorties</CommandItem>
          <CommandItem onSelect={() => go("/bons")}><FileCheck2 className="mr-2 h-4 w-4" /> Bons de sortie</CommandItem>
          <CommandItem onSelect={() => go("/inventory")}><ClipboardList className="mr-2 h-4 w-4" /> Inventaire périodique</CommandItem>
          <CommandItem onSelect={() => go("/reports")}><BarChart3 className="mr-2 h-4 w-4" /> Rapports</CommandItem>
          <CommandItem onSelect={() => go("/notifications")}><Bell className="mr-2 h-4 w-4" /> Notifications</CommandItem>
          {isAdmin && <CommandItem onSelect={() => go("/audit")}><History className="mr-2 h-4 w-4" /> Journal d'audit</CommandItem>}
          {isAdmin && <CommandItem onSelect={() => go("/users")}><Users className="mr-2 h-4 w-4" /> Utilisateurs</CommandItem>}
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" /> Paramètres</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => go("/stock/new")}><Plus className="mr-2 h-4 w-4" /> Nouvel article</CommandItem>
          <CommandItem onSelect={() => go("/entries/new")}><Plus className="mr-2 h-4 w-4" /> Nouvelle entrée</CommandItem>
          <CommandItem onSelect={() => go("/exits")}><Plus className="mr-2 h-4 w-4" /> Nouvelle sortie</CommandItem>
        </CommandGroup>
        {items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Articles">
              {items.map((i) => (
                <CommandItem key={i.id} onSelect={() => go(`/stock/${i.id}`)} value={`${i.name} ${i.sku ?? ""}`}>
                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{i.name}</span>
                  {i.sku && <span className="text-xs text-muted-foreground font-mono">{i.sku}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}