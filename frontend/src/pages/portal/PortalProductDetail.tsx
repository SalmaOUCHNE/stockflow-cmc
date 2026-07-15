import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getItem, getRecentMovements } from "@/services/localStoreAdapter";

interface Movement {
  id: string;
  date: string;
  user_name: string;
  pole: string;
  quantity: number;
  reference?: string;
}

interface Product {
  id?: string | number;
  name?: string;
  reference?: string;
  sku?: string;
  description?: string;
  category?: string;
  pole?: string;
  supplier?: string;
  unit?: string;
  location?: string;
  quantity?: number;
  min_threshold?: number;
  max_capacity?: number;
  image_url?: string;
  notes?: string;
}

const Icon = ({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
  >
    {name}
  </span>
);

const asString = (value: unknown) => (value === undefined || value === null ? "" : String(value));
const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const formatDate = (date: string) => {
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date || "—";
    return parsed.toLocaleDateString("fr-FR");
  } catch {
    return date || "—";
  }
};

const getStatusBadge = (qty: number, min: number) => {
  if (qty === 0)
    return { label: "Rupture", bgColor: "bg-red-100", textColor: "text-red-700", dotColor: "bg-red-500" };
  if (qty <= min)
    return { label: "Stock bas", bgColor: "bg-amber-100", textColor: "text-amber-700", dotColor: "bg-amber-500" };
  return { label: "Disponible", bgColor: "bg-green-100", textColor: "text-green-700", dotColor: "bg-green-500" };
};

export default function ArticleDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const item = await getItem(id ?? "");
        if (!mounted) return;
        setProduct(item || null);
        if (item) {
          const allMovements = await getRecentMovements();
          const productMovements = (Array.isArray(allMovements) ? allMovements : []).filter(
            (m: any) => String(m.product_id) === String(id)
          );
          const normalized = productMovements.map((m: any) => ({
            id: asString(m.id ?? ""),
            date: asString(m.date ?? m.date_mouvement ?? m.created_at ?? ""),
            user_name: asString(
              m.user?.full_name || 
              m.user?.name || 
              m.profile?.full_name ||
              m.requester_name || 
              m.raw?.user?.full_name || 
              "—"
            ),
            pole: item.pole ?? "—",
            quantity: asNumber(m.quantity ?? m.quantite ?? 0),
            reference: asString(m.reference ?? m.bon_numero ?? ""),
          }));
          setMovements(normalized);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full animate-pulse">
          <div className="h-8 w-1/3 bg-muted rounded mb-6" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 h-64 bg-card rounded-xl" />
            <div className="col-span-4 h-64 bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-6">
        <p className="text-sm text-foreground">Article introuvable</p>
        <Link to="/portal/catalogue" className="mt-4 text-primary hover:text-primary/80">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const sku = product.sku ?? product.reference ?? "—";
  const status = getStatusBadge(asNumber(product.quantity), asNumber(product.min_threshold));
  const progressPercentage = Math.min(
    100,
    (asNumber(product.quantity) / Math.max(asNumber(product.max_capacity), 1)) * 100
  );

  const specs: Array<[string, string]> = [
    ["Marque", product.supplier ?? "—"],
    ["Modèle", product.category ?? "—"],
    ["Référence", product.reference ?? "—"],
    ["SKU", sku],
    ["Unité", product.unit ?? "—"],
    ["Pôle assigné", product.pole ?? "—"],
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      
      <main className="flex-1 p-6 md:p-1 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link to="/portal/catalogue" className="hover:text-primary transition-colors">
              Accueil
            </Link>
            <Icon name="chevron_right" className="text-[14px]!" />
            <Link to="/portal/catalogue" className="hover:text-primary transition-colors">
              Catalogue
            </Link>
            <Icon name="chevron_right" className="text-[14px]!" />
            <span className="text-primary font-bold">Détail de l'article</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {product.name ?? "Article"}
          </h2>
        </nav>

        <div className="grid grid-cols-12 gap-6">
          {/* Article header */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 aspect-square rounded-lg overflow-hidden bg-muted">
                {product.image_url ? (
                  <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Icon name="inventory_2" className="text-[64px]!" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                      {product.category ?? "Catégorie"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.bgColor} ${status.textColor}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {product.name ?? "Nom du produit"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">SKU: {sku}</p>
                  <p className="text-base text-foreground leading-relaxed">
                    {product.description ?? "Aucune description disponible."}
                  </p>
                </div>
                <div className="mt-6">
                  <button className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Icon name="add_shopping_cart" />
                    Faire une demande
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Location */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border h-full flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-primary uppercase tracking-widest font-semibold mb-6">
                  Stock & Emplacement
                </h4>
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      {product.quantity ?? 0}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        {product.unit ?? "Unités"}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Seuil d'alerte: {product.min_threshold ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg mb-6 border border-border">
                  <Icon name="location_on" className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Zone de Stockage</p>
                    <p className="text-sm text-foreground">{product.location ?? "—"}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-border rounded-xl">
                <div className="w-32 h-32 bg-white p-2 border border-border rounded mb-2 flex items-center justify-center">
                  <QRCodeSVG value={sku} size={120} level="M" color="#000000" />
                </div>
                <p className="text-xs text-muted-foreground italic">Scanner pour détails</p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="col-span-12">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h4 className="text-xs text-primary uppercase tracking-widest font-semibold mb-6">
                Spécifications Techniques
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {specs.map(([label, value]) => (
                  <div key={label} className="p-4 bg-background border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Allocation history */}
          {movements.length > 0 && (
            <div className="col-span-12">
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h4 className="text-xs text-primary uppercase tracking-widest font-semibold">
                    Historique des attributions
                  </h4>
                  <button className="text-primary text-sm hover:underline flex items-center gap-1">
                    <Icon name="download" className="text-[18px]!" />
                    Exporter .csv
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Destinataire</th>
                        <th className="px-6 py-4 font-semibold">Pôle</th>
                        <th className="px-6 py-4 font-semibold">Quantité</th>
                        <th className="px-6 py-4 font-semibold text-right">Bon de sortie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {movements.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">{formatDate(a.date)}</td>
                          <td className="px-6 py-4 font-medium">{a.user_name}</td>
                          <td className="px-6 py-4">{a.pole}</td>
                          <td className="px-6 py-4">{a.quantity}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-primary hover:text-primary/70">
                              <Icon name="description" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-border pt-8 pb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <Icon name="support_agent" />
              </div>
              <div>
                <p className="text-sm text-foreground">Besoin d'aide sur cet article ?</p>
                <p className="text-sm text-muted-foreground">
                  Notre équipe technique est disponible pour répondre à vos questions.
                </p>
              </div>
            </div>
            
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 StockFlow CMC — Système de gestion industrielle 
          </p>
        </footer>
      </main>
    </div>
  );
}

