import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import {
  Pencil,
  BadgeCheck,
  ShieldCheck,
  Plus,
  Minus,
  ArrowLeftRight,
  Wrench,
  MapPin,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Package,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
  X,
} from "lucide-react";
import { getItem, getRecentMovements } from "@/services/localStoreAdapter";
import { expiryInfo } from "@/lib/expiry";
import { useAuth } from "@/hooks/useAuth";
import cmcLogo from "@/assets/logo-cmc.png";
// --- Types ---------------------------------------------------------------

type MovementType = "entry" | "exit" | "transfer";
interface Movement {
  id: string;
  product_id?: string | number;
  type: MovementType;
  quantity: number;
  date: string;
  user_name: string;
  reference?: string;
  document?: string;
  profile?: { full_name?: string };
  requester_name?: string;
  raw?: Record<string, unknown>;
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
  expires_at?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
  barcode?: string;
  notes?: string;
  condition?: string;
  warrantyMonths?: number;
  warranty?: string;
  purchase_price?: number;
  purchase_date?: string;
  turnoverRate?: number;
  turnover_rate?: number;
  raw?: Record<string, unknown>;
}

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const asString = (value: unknown) => (value === undefined || value === null ? "" : String(value));
const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const normalizeMovementType = (rawType: unknown): MovementType => {
  const type = asString(rawType).toLowerCase();
  if (type.includes("sortie") || type.includes("exit")) return "exit";
  if (type.includes("transfert") || type.includes("transfer")) return "transfer";
  return "entry";
};

const normalizeMovement = (movement: Record<string, unknown>): Movement => {
  return {
    id: asString(movement.id ?? movement.reference ?? ""),
    product_id: movement.product_id ?? movement.item_id ?? (movement.product as any)?.id,
    type: normalizeMovementType(movement.type ?? (movement.raw as any)?.type),
    quantity: asNumber(movement.quantity ?? movement.quantite ?? 0),
    date: asString(
      movement.date ?? movement.date_mouvement ?? movement.created_at ?? (movement.raw as any)?.created_at ?? ""
    ),
    user_name:
      asString((movement.profile as any)?.full_name) ||
      asString(movement.requester_name) ||
      asString((movement.raw as any)?.user?.full_name) ||
      asString((movement.raw as any)?.user?.name) ||
      "—",
    reference: asString(movement.reference ?? (movement.raw as any)?.reference ?? ""),
    profile: movement.profile as { full_name?: string } | undefined,
    requester_name: asString(movement.requester_name),
    document: asString(
      movement.document ?? movement.reference ?? (movement.raw as any)?.document ?? (movement.raw as any)?.order_number ?? (movement.raw as any)?.bon_number
    ),
    raw: movement.raw as Record<string, unknown> | undefined,
  };
};

const getStatusMeta = (qty: number, min: number) => {
  if (qty === 0) return { label: "Rupture", pill: "bg-red-100 text-red-800", dot: "bg-red-600" };
  if (qty <= min) return { label: "Stock bas", pill: "bg-amber-100 text-amber-800", dot: "bg-amber-600" };
  return { label: "En stock", pill: "bg-green-100 text-green-800", dot: "bg-green-600" };
};

const getInitials = (name?: string) => {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
};

const parseZoneRack = (location: string): { zone?: string; rack?: string } => {
  const normalized = location.trim();
  const zoneMatch = normalized.match(/zone\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  const rackMatch = normalized.match(/rack\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  return {
    zone: zoneMatch ? zoneMatch[1].toUpperCase() : undefined,
    rack: rackMatch ? rackMatch[1].toUpperCase() : undefined,
  };
};

const getLocationDetails = (product: Product) => {
  const raw = product.raw ?? {};
  const location = product.location || asString((raw as any).emplacement ?? (raw as any).location ?? "");
  const zone = asString((raw as any).zone ?? (raw as any).zone_name ?? (raw as any).zoneLabel ?? (raw as any).zone_label ?? "");
  const rack = asString((raw as any).rack ?? (raw as any).rack_name ?? (raw as any).rackLabel ?? (raw as any).rack_label ?? "");
  if (zone || rack) {
    return { location, zone: zone || undefined, rack: rack || undefined };
  }
  const parsed = parseZoneRack(location);
  return {
    location,
    zone: parsed.zone,
    rack: parsed.rack,
  };
};

// Petit hash déterministe pour varier visuellement la case mise en évidence
// du plan logistique selon le produit (purement décoratif, en attendant de
// vraies coordonnées d'entrepôt côté backend).
function simpleHash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Charge une image distante et la convertit en data URL, pour qu'elle
// s'intègre correctement au rendu PDF (html2canvas) même en cas de CORS.
async function toDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementFilter, setMovementFilter] = useState<"all" | "entry" | "exit" | "transfer">("all");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [csvStatus, setCsvStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const searchParams = new URLSearchParams(window.location.search);
  const isPortalRoute = window.location.pathname.includes("/portal/produit/");
  const isUserMode = searchParams.get("mode") === "user" || isPortalRoute;

  const pushToast = (kind: ToastKind, message: string) => {
    const toastId = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id: toastId, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4200);
  };
  const dismissToast = (toastId: number) => setToasts((prev) => prev.filter((t) => t.id !== toastId));

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError("Identifiant de produit introuvable.");
          setProduct(null);
          setMovements([]);
          return;
        }

        const [found, allMov] = await Promise.all([getItem(id), getRecentMovements()]);
        if (!mounted) return;

        if (!found) {
          setProduct(null);
          setMovements([]);
          setError("Aucun produit ne correspond à cet identifiant.");
          return;
        }

        setProduct(found);

        const filtered = Array.isArray(allMov)
          ? allMov
              .filter((m: any) => String(m.product_id ?? m.item_id ?? m.product?.id ?? "") === String(id))
              .map((movement: any) => normalizeMovement(movement as Record<string, unknown>))
              .sort((a, b) => a.date.localeCompare(b.date))
          : [];

        setMovements(filtered.reverse());
      } catch {
        if (!mounted) return;
        setProduct(null);
        setMovements([]);
        setError("Impossible de charger les données du produit. Veuillez réessayer.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();

    const handleStockMovementCreated = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string | number }>).detail;
      if (!detail?.productId) return;
      if (String(detail.productId) !== String(id)) return;
      void loadProduct();
    };

    window.addEventListener("stockMovementCreated", handleStockMovementCreated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("stockMovementCreated", handleStockMovementCreated as EventListener);
    };
  }, [id]);

  const percent = useMemo(() => {
    if (!product) return 0;
    const max = Number(product.max_capacity ?? 0);
    if (max <= 0) return 0;
    return Math.min(100, Math.round((Number(product.quantity ?? 0) / max) * 100));
  }, [product]);

  // Agrégation des mouvements des 7 derniers jours (entrées / sorties par jour)
  const usage = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      return { d: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), entry: 0, exit: 0 };
    });
    movements.forEach((m) => {
      try {
        const key = new Date(m.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
        const bucket = days.find((x) => x.d === key);
        if (!bucket) return;
        if (m.type === "entry") bucket.entry += Number(m.quantity ?? 0);
        else bucket.exit += Number(m.quantity ?? 0);
      } catch {
        /* ignore malformed dates */
      }
    });
    return days;
  }, [movements]);

  const safetyBuffer = useMemo(() => {
    if (!product) return "Low";
    return Number(product.quantity ?? 0) > Number(product.min_threshold ?? 0) * 1.5 ? "Secure" : "Low";
  }, [product]);

  const reorderProb = useMemo(() => {
    if (percent <= 10) return { label: "High", cls: "bg-red-100 text-red-700" };
    if (percent <= 40) return { label: "Medium", cls: "bg-amber-100 text-amber-700" };
    return { label: "Low", cls: "bg-blue-100 text-blue-700" };
  }, [percent]);

  // Approximation du "temps de séjour moyen" à partir de l'écart entre les
  // mouvements enregistrés (proxy simple, pas une vraie durée de cycle).
  const averageStayDays = useMemo(() => {
    if (movements.length < 2) return null;
    const sorted = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = new Date(sorted[0].date).getTime();
    const last = new Date(sorted[sorted.length - 1].date).getTime();
    const spanDays = (last - first) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(spanDays / sorted.length));
  }, [movements]);

  // --- Nouveaux indicateurs pour le panneau "Insights" -------------------

  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return movements.filter((m) => {
      const t = new Date(m.date).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
  }, [movements]);

  const consumedLast30 = useMemo(
    () => last30.filter((m) => m.type === "exit").reduce((sum, m) => sum + Number(m.quantity ?? 0), 0),
    [last30]
  );
  const receivedLast30 = useMemo(
    () => last30.filter((m) => m.type === "entry").reduce((sum, m) => sum + Number(m.quantity ?? 0), 0),
    [last30]
  );

  const dailyBurnRate = useMemo(() => {
    if (consumedLast30 <= 0) return 0;
    return consumedLast30 / 30;
  }, [consumedLast30]);

  const daysOfCover = useMemo(() => {
    if (!product || dailyBurnRate <= 0) return null;
    return Math.max(0, Math.round(Number(product.quantity ?? 0) / dailyBurnRate));
  }, [product, dailyBurnRate]);

  const trendVsPrevious = useMemo(() => {
    // Compare les 7 derniers jours aux 7 jours précédents (sorties).
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const recent = movements.filter((m) => {
      const t = new Date(m.date).getTime();
      return m.type === "exit" && t >= now - 7 * day && t <= now;
    });
    const prior = movements.filter((m) => {
      const t = new Date(m.date).getTime();
      return m.type === "exit" && t >= now - 14 * day && t < now - 7 * day;
    });
    const recentSum = recent.reduce((s, m) => s + Number(m.quantity ?? 0), 0);
    const priorSum = prior.reduce((s, m) => s + Number(m.quantity ?? 0), 0);
    if (priorSum === 0 && recentSum === 0) return { delta: 0, direction: "flat" as const };
    if (priorSum === 0) return { delta: 100, direction: "up" as const };
    const delta = Math.round(((recentSum - priorSum) / priorSum) * 100);
    return { delta: Math.abs(delta), direction: delta >= 0 ? ("up" as const) : ("down" as const) };
  }, [movements]);

  const lastMovement = movements[0] ?? null;

  const recommendation = useMemo(() => {
    if (!product) return null;
    const qty = Number(product.quantity ?? 0);
    const min = Number(product.min_threshold ?? 0);
    if (qty === 0) {
      return {
        tone: "critical" as const,
        title: "Rupture de stock",
        text: "Cet article est épuisé. Lancez une commande de réapprovisionnement en priorité.",
      };
    }
    if (qty <= min) {
      return {
        tone: "warning" as const,
        title: "Stock sous le seuil minimum",
        text: daysOfCover !== null
          ? `Au rythme de consommation actuel, la couverture restante est d'environ ${daysOfCover} jour(s). Planifiez une commande.`
          : "Le niveau est sous le seuil minimum défini. Planifiez une commande de réapprovisionnement.",
      };
    }
    if (daysOfCover !== null && daysOfCover <= 14) {
      return {
        tone: "info" as const,
        title: "Couverture limitée",
        text: `Environ ${daysOfCover} jour(s) de couverture au rythme actuel. Surveillez ce produit.`,
      };
    }
    return {
      tone: "good" as const,
      title: "Niveau de stock sain",
      text: "Aucune action requise pour le moment. Le stock couvre la demande actuelle.",
    };
  }, [product, daysOfCover]);

  const filteredMovements = useMemo(() => {
    if (movementFilter === "all") return movements;
    return movements.filter((m) => m.type === movementFilter);
  }, [movements, movementFilter]);

  const sku = product?.sku ?? product?.reference ?? "";
  const qrPayload = typeof window !== "undefined" ? `${window.location.origin}/catalogue/${id ?? ""}` : id ?? "";
  const locDetails = product ? getLocationDetails(product) : { location: "", zone: undefined, rack: undefined };
  const locationLabel = product
    ? locDetails.zone || locDetails.rack
      ? `${locDetails.zone ? `ZONE ${locDetails.zone}` : ""}${locDetails.zone && locDetails.rack ? " - " : ""}${
          locDetails.rack ? `RACK ${locDetails.rack}` : ""
        }`
      : product.location ?? "—"
    : "—";

  const downloadQrSvg = () => {
    try {
      const el = document.getElementById("product-qr") as SVGElement | null;
      if (!el) {
        pushToast("error", "Le QR code n'est pas encore prêt. Réessayez dans un instant.");
        return;
      }
      let svg = el.outerHTML;
      if (!svg.includes("xmlns")) {
        svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const content = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
      const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sku || "qr"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast("success", "QR code téléchargé.");
    } catch {
      pushToast("error", "Le téléchargement du QR code a échoué.");
    }
  };

  const printAssetTag = () => {
    try {
      const svg = document.getElementById("product-qr")?.outerHTML ?? "";
      if (!svg) {
        pushToast("error", "Le QR code n'est pas encore prêt. Réessayez dans un instant.");
        return;
      }
      const titleLabel = sku || product?.name || "";
      const w = window.open("", "_blank", "width=420,height=520");
      if (!w) {
        pushToast("error", "Le navigateur a bloqué l'ouverture de la fenêtre d'impression.");
        return;
      }
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Étiquette ${titleLabel}</title><style>body{font-family:system-ui;margin:0;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center}h2{margin:8px 0 4px;font-size:16px}code{font-family:monospace;background:#f5f5f5;padding:4px;border-radius:4px}</style></head><body>${svg}<h2>${
        product?.name ?? titleLabel
      }</h2><div style="color:#666;margin-bottom:8px;font-family:monospace">${titleLabel}</div><div style="color:#666;font-size:12px">${locationLabel}</div></body></html>`;
      w.document.write(html);
      w.document.close();
      window.setTimeout(() => {
        w.print();
        w.close();
      }, 300);
      pushToast("success", "Étiquette envoyée à l'impression.");
    } catch {
      pushToast("error", "L'impression de l'étiquette a échoué.");
    }
  };

  const loadHtml2Pdf = async () => {
    const globalHtml2Pdf = (window as any).html2pdf;
    if (globalHtml2Pdf) return globalHtml2Pdf;
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.14.0/html2pdf.bundle.min.js";
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error("Impossible de charger la bibliothèque PDF."));
      document.body.appendChild(script);
    });
  };

  const generatedByName = useMemo(() => {
    if (!profile) return "Utilisateur";
    const full = [profile.prenom, profile.nom].filter(Boolean).join(" ").trim();
    return full || profile.email || "Utilisateur";
  }, [profile]);

  const handleExportPdf = async () => {
    if (!product) return;
    setPdfStatus("loading");
    let node: HTMLDivElement | null = null;
    try {
      const html2pdf = await loadHtml2Pdf();

      const [logoData, productImgData, qrImgMarkup] = await Promise.all([
        toDataUrl(cmcLogo),
        toDataUrl(product.image_url ?? undefined),
        Promise.resolve(document.getElementById("product-qr")?.outerHTML ?? ""),
      ]);

      const now = new Date();
      const generatedAt = now.toLocaleString("fr-FR");
      const raw = product.raw ?? {};
      const expiresAt =
        product.expires_at ?? product.expiry_date ?? (raw["date_expiration"] as string | undefined) ?? (raw["expires_at"] as string | undefined) ?? null;
      const expiry = expiresAt ? expiryInfo(expiresAt) : null;
      const status = getStatusMeta(Number(product.quantity ?? 0), Number(product.min_threshold ?? 0));

      const rows = filteredMovements
        .slice(0, 15)
        .map(
          (m) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">${m.id || m.reference || "—"}</td>
          <td style="padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">${new Date(m.date).toLocaleString("fr-FR")}</td>
          <td style="padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">${
            m.type === "entry" ? "ENTRÉE" : m.type === "exit" ? "SORTIE" : "TRANSFERT"
          }</td>
          <td style="padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">${
            m.type === "entry" ? "+" : m.type === "exit" ? "-" : ""
          }${m.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">${
            m.profile?.full_name ?? m.requester_name ?? "—"
          }</td>
        </tr>`
        )
        .join("");

      node = document.createElement("div");
      node.id = "product-report-print-area";
      node.style.position = "fixed";
      node.style.left = "-9999px";
      node.style.top = "0";
      node.style.width = "780px";
      node.style.background = "#ffffff";

      node.innerHTML = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;padding:28px;width:780px;box-sizing:border-box">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:18px">
            <div style="display:flex;align-items:center;gap:12px">
              ${logoData ? `<img src="${logoData}" style="height:48px;object-fit:contain"/>` : ""}
              <div>
                <div style="font-size:18px;font-weight:700;letter-spacing:.3px">Rapport produit</div>
                <div style="font-size:11px;color:#666">Fiche détaillée et historique des mouvements</div>
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#666">
              <div>Généré le ${generatedAt}</div>
              <div>Par ${generatedByName}</div>
            </div>
          </div>

          <div style="display:flex;gap:18px;margin-bottom:18px">
            <div style="width:140px;height:140px;border:1px solid #e6e6e6;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f7f8fb;flex-shrink:0">
              ${
                productImgData
                  ? `<img src="${productImgData}" style="max-width:100%;max-height:100%;object-fit:contain"/>`
                  : `<span style="font-size:11px;color:#999">Pas d'image</span>`
              }
            </div>
            <div style="flex:1">
              <div style="font-size:20px;font-weight:700;margin-bottom:4px">${product.name ?? "—"}</div>
              <div style="font-size:12px;color:#555;margin-bottom:10px">${product.description ?? ""}</div>
              <div style="display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;background:${
                status.label === "Rupture" ? "#fee2e2" : status.label === "Stock bas" ? "#fef3c7" : "#dcfce7"
              };color:${status.label === "Rupture" ? "#991b1b" : status.label === "Stock bas" ? "#92400e" : "#166534"}">${status.label}</div>
              <table style="margin-top:12px;font-size:12px;width:100%;border-collapse:collapse">
                <tr><td style="padding:3px 0;color:#666;width:130px">SKU / Référence</td><td style="padding:3px 0;font-weight:600">${sku || "—"}</td></tr>
                <tr><td style="padding:3px 0;color:#666">Catégorie</td><td style="padding:3px 0">${product.category ?? "—"}</td></tr>
                <tr><td style="padding:3px 0;color:#666">Pôle</td><td style="padding:3px 0">${product.pole ?? "—"}</td></tr>
                <tr><td style="padding:3px 0;color:#666">Fournisseur</td><td style="padding:3px 0">${product.supplier ?? "—"}</td></tr>
              </table>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
            <div style="border:1px solid #e6e6e6;border-radius:8px;padding:10px">
              <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px">Stock actuel</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px">${product.quantity ?? 0} <span style="font-size:11px;font-weight:400;color:#666">${product.unit ?? ""}</span></div>
            </div>
            <div style="border:1px solid #e6e6e6;border-radius:8px;padding:10px">
              <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px">Seuil minimum</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px">${product.min_threshold ?? "—"}</div>
            </div>
            <div style="border:1px solid #e6e6e6;border-radius:8px;padding:10px">
              <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px">Capacité maximale</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px">${product.max_capacity ?? "—"}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            <div>
              <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#2563eb">Emplacement & logistique</div>
              <table style="font-size:12px;width:100%;border-collapse:collapse">
                <tr><td style="padding:3px 0;color:#666;width:110px">Emplacement</td><td style="padding:3px 0">${locationLabel}</td></tr>
                <tr><td style="padding:3px 0;color:#666">Code-barres</td><td style="padding:3px 0">${product.barcode ?? "—"}</td></tr>
                <tr><td style="padding:3px 0;color:#666">État</td><td style="padding:3px 0">${product.condition ?? "—"}</td></tr>
                <tr><td style="padding:3px 0;color:#666">Garantie</td><td style="padding:3px 0">${
                  product.warrantyMonths ? `${product.warrantyMonths} mois` : product.warranty ?? "—"
                }</td></tr>
              </table>
            </div>
            <div>
              <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#2563eb">Achat & expiration</div>
              <table style="font-size:12px;width:100%;border-collapse:collapse">
                <tr><td style="padding:3px 0;color:#666;width:110px">Date d'achat</td><td style="padding:3px 0">${
                  product.purchase_date ? new Date(product.purchase_date).toLocaleDateString("fr-FR") : "—"
                }</td></tr>
                <tr><td style="padding:3px 0;color:#666">Prix d'achat</td><td style="padding:3px 0">${
                  product.purchase_price !== undefined && product.purchase_price !== null ? `${product.purchase_price} MAD` : "—"
                }</td></tr>
                <tr><td style="padding:3px 0;color:#666">Date création</td><td style="padding:3px 0">${
                  product.created_at ? new Date(product.created_at).toLocaleDateString("fr-FR") : "—"
                }</td></tr>
                <tr><td style="padding:3px 0;color:#666">Expiration</td><td style="padding:3px 0">${
                  expiresAt ? new Date(expiresAt).toLocaleDateString("fr-FR") : "—"
                }${expiry?.label ? ` (${expiry.label})` : ""}</td></tr>
              </table>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:16px;border:1px solid #e6e6e6;border-radius:8px;padding:14px;margin-bottom:18px;background:#f7f8fb">
            ${qrImgMarkup || ""}
            <div style="font-size:12px;color:#555">
              <div style="font-weight:700;margin-bottom:2px">Identifiant de l'actif</div>
              <div style="font-family:monospace;font-size:12px;color:#2563eb">${sku || id}</div>
              <div style="margin-top:4px;font-size:11px;color:#888">Scannez ce code pour accéder directement à la fiche produit.</div>
            </div>
          </div>

          <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#2563eb">Historique des mouvements récents</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="text-align:left;padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">Transaction</th>
                <th style="text-align:left;padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">Date</th>
                <th style="text-align:left;padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">Type</th>
                <th style="text-align:left;padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">Quantité</th>
                <th style="text-align:left;padding:6px 8px;border:1px solid #e6e6e6;font-size:11px">Utilisateur</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="5" style="padding:10px;text-align:center;font-size:11px;color:#888;border:1px solid #e6e6e6">Aucun mouvement enregistré</td></tr>`}</tbody>
          </table>

          <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e6e6e6;font-size:10px;color:#999;display:flex;justify-content:space-between">
            <span>Document généré automatiquement — ${generatedAt}</span>
            <span>Page 1</span>
          </div>
        </div>
      `;
      document.body.appendChild(node);

      await html2pdf()
        .set({
          margin: 10,
          filename: `rapport-${sku || id || "produit"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(node)
        .save();

      setPdfStatus("success");
      pushToast("success", "Le rapport PDF a été généré et téléchargé.");
    } catch (err) {
      console.error(err);
      setPdfStatus("error");
      pushToast("error", "La génération du rapport PDF a échoué. Veuillez réessayer.");
    } finally {
      if (node && node.parentNode) node.parentNode.removeChild(node);
      window.setTimeout(() => setPdfStatus("idle"), 2200);
    }
  };

  const handleExportCsv = () => {
    setCsvStatus("loading");
    try {
      const header = ["Transaction", "Date", "Type", "Quantite", "Utilisateur"];
      const rows = movements.map((m) => [
        m.id || m.reference || "",
        new Date(m.date).toLocaleString("fr-FR"),
        m.type === "entry" ? "IN - RECEPTION" : m.type === "exit" ? "OUT - DEPLOYMENT" : "TRANSFER",
        m.quantity ?? 0,
        m.profile?.full_name ?? m.requester_name ?? "—",
      ]);
      const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sku || id || "export"}-mouvements.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setCsvStatus("success");
      pushToast("success", "Export CSV téléchargé.");
    } catch (err) {
      console.error(err);
      setCsvStatus("error");
      pushToast("error", "L'export CSV a échoué.");
    } finally {
      window.setTimeout(() => setCsvStatus("idle"), 2200);
    }
  };

  if (loading) {
    return (
      <div className="p-10 max-w-[1280px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/3 bg-muted rounded" />
          <div className="mt-4 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 h-72 bg-card rounded-xl shadow-soft" />
            <div className="col-span-12 lg:col-span-4 h-72 bg-card rounded-xl shadow-soft" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 max-w-[1280px] mx-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Article introuvable</h2>
          <p className="text-sm text-muted-foreground mt-1">{error ?? "Le produit demandé n'existe pas ou a été supprimé."}</p>
        </div>
        <Card className="p-8 text-center rounded-xl shadow-soft">
          <div className="text-xl font-semibold">Produit non trouvé</div>
          <p className="mt-2 text-sm text-muted-foreground">Vérifiez l'URL ou retournez à la liste du stock.</p>
          <Link to={isUserMode ? "/portal/catalogue" : "/stock"} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← {isUserMode ? "Retour au catalogue" : "Retour au stock"}
          </Link>
        </Card>
      </div>
    );
  }

  const status = getStatusMeta(Number(product.quantity ?? 0), Number(product.min_threshold ?? 0));
  const highlightIndex = simpleHash(String(locDetails.rack ?? product.id ?? id ?? "0")) % 16;
  const raw = product.raw ?? {};
  const expiresAt = product.expires_at ?? product.expiry_date ?? (raw["date_expiration"] as string | undefined) ?? (raw["expires_at"] as string | undefined) ?? null;
  const expiry = expiresAt ? expiryInfo(expiresAt) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 shadow-soft text-sm ${
              t.kind === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : t.kind === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : t.kind === "error" ? (
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <Activity className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <main className="p-2 max-w-[1280px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.pill}`}>
                <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                {status.label}
              </span>
            </div>
            <div className="flex gap-1">
              {!isUserMode && (
                <button
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                  onClick={() => navigate(`/products/${id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Hero: Product */}
          <section className="col-span-12 lg:col-span-8 bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row shadow-soft">
            <div className="md:w-1/3 bg-indigo-50 p-6 flex items-center justify-center relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-auto object-contain mix-blend-multiply" />
              ) : (
                <div className="text-center p-4">
                  <div className="text-sm font-medium text-muted-foreground">Pas d'image</div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg border border-border text-xs font-bold text-primary">
                SKU: {sku || "—"}
              </div>
            </div>
            <div className="md:w-2/3 p-6 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold mb-2">Spécifications techniques</h3>
                  <p className="text-base text-muted-foreground mb-6 leading-relaxed">{product.description ?? "—"}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border/50">
                      <BadgeCheck className="text-primary h-5 w-5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">État</span>
                        <span className="text-sm font-semibold text-foreground">{product.condition ?? "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border/50">
                      <ShieldCheck className="text-primary h-5 w-5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Garantie</span>
                        <span className="text-sm font-semibold text-foreground">
                          {product.warrantyMonths ? `${product.warrantyMonths} mois` : product.warranty ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Niveau de remplissage</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {product.quantity ?? 0} <span className="text-sm font-medium">{product.unit}</span>
                  </div>
                  <div className="mt-3 h-3 w-40 rounded-full bg-muted">
                    <div
                      className={`${percent <= 10 ? "bg-destructive" : percent <= 40 ? "bg-warning" : "bg-success"} h-full rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {product.quantity ?? 0} / {product.max_capacity ?? "—"} ({percent}%)
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          {!isUserMode && (
            <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              <div className="bg-primary p-6 rounded-xl text-primary-foreground shadow-soft relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-xl font-bold mb-4">Opérations</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Plus, label: "Nouvelle entrée", action: "entry", tag: "Auto-sync", tagCls: "opacity-60" },
                      { icon: Minus, label: "Enregistrer sortie", action: "exit" },
                      { icon: ArrowLeftRight, label: "Transférer zone", action: "transfer" },
                      { icon: Wrench, label: "Planifier maintenance", action: "maintenance" },
                    ].map((b) => (
                      <button
                        key={b.label}
                        onClick={() => {
                          if (b.action === "entry") return navigate(`/entries/new?productId=${id}`);
                          if (b.action === "exit") return navigate(`/exits?productId=${id}`);
                          if (b.action === "transfer") return navigate(`/inventory?productId=${id}`);
                          return navigate(`/reports?productId=${id}`);
                        }}
                        className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-all p-3 rounded-lg text-sm font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <b.icon className="h-4 w-4" /> {b.label}
                        </div>
                        {b.tag && <span className={`text-[10px] ${b.tagCls ?? ""}`}>{b.tag}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <Package className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 pointer-events-none" />
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Export rapide</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPdf}
                    disabled={pdfStatus === "loading"}
                    className="flex-grow py-2 px-4 rounded-lg bg-muted text-primary text-sm font-semibold hover:bg-muted/70 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {pdfStatus === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Génération…
                      </>
                    ) : pdfStatus === "success" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Rapport prêt
                      </>
                    ) : pdfStatus === "error" ? (
                      <>
                        <AlertTriangle className="h-4 w-4" /> Réessayer
                      </>
                    ) : (
                      "Rapport PDF"
                    )}
                  </button>
                  <button
                    onClick={handleExportCsv}
                    disabled={csvStatus === "loading"}
                    className="flex-grow py-2 px-4 rounded-lg bg-muted text-primary text-sm font-semibold hover:bg-muted/70 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {csvStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "CSV"}
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* Informations générales + Spécifications */}
          <section className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border shadow-soft">
              <h3 className="font-semibold">Informations générales</h3>
              <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Fournisseur</div>
                  <div className="mt-1">{product.supplier ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Catégorie</div>
                  <div className="mt-1">{product.category ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pôle</div>
                  <div className="mt-1">{product.pole ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Emplacement</div>
                  <div className="mt-1">{locationLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date création</div>
                  <div className="mt-1">{product.created_at ? new Date(product.created_at).toLocaleDateString("fr-FR") : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expiration</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span>{expiresAt ? new Date(expiresAt).toLocaleDateString("fr-FR") : "—"}</span>
                    {expiry?.label && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          expiry.urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {expiry.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border shadow-soft">
              <h3 className="font-semibold">Spécifications</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Unité</dt>
                  <dd>{product.unit ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence</dt>
                  <dd className="font-mono">{sku || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Barcode</dt>
                  <dd>{product.barcode ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd>{product.notes ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Logistics Hub */}
          <section className="col-span-12 lg:col-span-4 bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Logistics Hub</h3>
              <MapPin className="text-primary h-5 w-5" />
            </div>
            <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden relative border border-border/50">
              <div className="absolute inset-0 p-4">
                <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full w-full">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={
                        i === highlightIndex
                          ? "bg-primary/20 border-2 border-primary rounded flex items-center justify-center"
                          : "bg-border/40 rounded"
                      }
                    >
                      {i === highlightIndex && <span className="w-3 h-3 bg-primary rounded-full animate-ping" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {locationLabel}
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-xl border border-border shadow-sm">
              <div className="w-32 h-32 bg-white p-2 rounded-lg border border-border/50 shadow-inner mb-4 flex items-center justify-center">
                <QRCodeSVG id="product-qr" value={sku || qrPayload} size={112} level="M" />
              </div>
              <div className="text-center mb-6">
                <span className="text-xs text-muted-foreground block uppercase tracking-widest mb-1">Identifiant de l'actif</span>
                <code className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">ID: {sku || id}</code>
              </div>
              <div className="w-full flex flex-col gap-2">
                {!isUserMode && (
                  <>
                    <button
                      onClick={printAssetTag}
                      className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" /> Imprimer l'étiquette
                    </button>
                    <button
                      onClick={downloadQrSvg}
                      className="w-full bg-muted text-primary py-2 rounded-lg text-sm font-semibold hover:bg-muted/70 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Télécharger SVG
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Insights Hub — remplace "Évolution du stock" */}
          <section className="col-span-12 lg:col-span-8 bg-card p-6 rounded-xl border border-border shadow-soft">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-semibold">Aperçu et recommandations</h3>
                <p className="text-sm text-muted-foreground">Analyse de la consommation et de la santé du stock</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Sparkles className="h-3 w-3" /> 30 derniers jours
              </span>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Santé du stock</span>
                  <Gauge className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">{percent}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`${percent <= 10 ? "bg-destructive" : percent <= 40 ? "bg-warning" : "bg-success"} h-full rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Couverture</span>
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{daysOfCover ?? "—"}</span>
                  {daysOfCover !== null && <span className="text-xs text-muted-foreground">jours</span>}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {dailyBurnRate > 0 ? `~${dailyBurnRate.toFixed(1)} ${product.unit ?? "u."}/jour` : "Pas de sortie récente"}
                </div>
              </div>

              <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tendance sorties</span>
                  {trendVsPrevious.direction === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                  ) : trendVsPrevious.direction === "down" ? (
                    <TrendingDown className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {trendVsPrevious.direction === "up" && <ArrowUpRight className="h-4 w-4 text-destructive" />}
                  {trendVsPrevious.direction === "down" && <ArrowDownRight className="h-4 w-4 text-success" />}
                  <span className="text-xl font-bold">{trendVsPrevious.delta}%</span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">vs. semaine précédente</div>
              </div>

              <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Réapprovisionnement</span>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${safetyBuffer === "Secure" ? "text-success" : "text-warning"}`} />
                  </div>
                  <span className={`inline-block max-w-full break-words px-2 py-0.5 rounded text-[10px] font-bold uppercase ${reorderProb.cls}`}>
                    {reorderProb.label === "High" ? "Élevée" : reorderProb.label === "Medium" ? "Moyenne" : "Faible"}
                  </span>
                  <div className="text-[11px] text-muted-foreground break-words">
                    Durée moy. de séjour : {averageStayDays ?? "—"} {averageStayDays ? "j" : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation banner */}
            {recommendation && (
              <div
                className={`flex items-start gap-3 rounded-lg p-4 border mb-6 ${
                  recommendation.tone === "critical"
                    ? "bg-red-50 border-red-200"
                    : recommendation.tone === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : recommendation.tone === "info"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                {recommendation.tone === "critical" || recommendation.tone === "warning" ? (
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      recommendation.tone === "critical" ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                ) : (
                  <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${recommendation.tone === "info" ? "text-blue-600" : "text-green-600"}`} />
                )}
                <div>
                  <div
                    className={`text-sm font-semibold ${
                      recommendation.tone === "critical"
                        ? "text-red-800"
                        : recommendation.tone === "warning"
                        ? "text-amber-800"
                        : recommendation.tone === "info"
                        ? "text-blue-800"
                        : "text-green-800"
                    }`}
                  >
                    {recommendation.title}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{recommendation.text}</p>
                </div>
              </div>
            )}

            {/* 30-day movement summary + recent activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Résumé des mouvements (30 jours)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-success" /> Reçu
                    </div>
                    <span className="font-semibold text-success">+{receivedLast30}</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-destructive" /> Consommé
                    </div>
                    <span className="font-semibold text-destructive">-{consumedLast30}</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Mouvements enregistrés
                    </div>
                    <span className="font-semibold">{last30.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Dernière activité</h4>
                {lastMovement ? (
                  <div className="flex items-start gap-3 bg-muted/40 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getInitials(lastMovement.profile?.full_name ?? lastMovement.requester_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm">
                        <span className="font-semibold">{lastMovement.profile?.full_name ?? lastMovement.requester_name ?? "—"}</span>{" "}
                        <span className="text-muted-foreground">
                          {lastMovement.type === "entry" ? "a réceptionné" : lastMovement.type === "exit" ? "a sorti" : "a transféré"}
                        </span>{" "}
                        <span className="font-semibold">
                          {lastMovement.quantity} {product.unit ?? ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" /> {new Date(lastMovement.date).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground">Aucune activité récente.</div>
                )}
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {usage.map((d, i) => {
                    const total = d.entry + d.exit;
                    const maxTotal = Math.max(...usage.map((x) => x.entry + x.exit), 1);
                    const h = Math.max(4, Math.round((total / maxTotal) * 32));
                    return (
                      <div key={i} className="flex flex-col items-center gap-1" title={`${d.d}: +${d.entry} / -${d.exit}`}>
                        <div className="w-full h-8 flex items-end justify-center">
                          <div className="w-2 rounded-full bg-primary/60" style={{ height: `${h}px` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{d.d}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Movement Logs */}
          <section className="col-span-12 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold">Historique des mouvements</h3>
                <p className="text-sm text-muted-foreground">Historique des transactions pour {product.name}</p>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <select
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value as "all" | "entry" | "exit" | "transfer")}
                  className="pl-9 pr-8 py-2 border border-border rounded-lg text-xs bg-muted/50 appearance-none focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="all">Tous les mouvements</option>
                  <option value="entry">Entrées seulement</option>
                  <option value="exit">Sorties seulement</option>
                  <option value="transfer">Transferts seulement</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Transaction ID</th>
                    <th className="px-6 py-4 font-bold">Date &amp; Time</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold">Quantity</th>
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredMovements.slice(0, 8).map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{m.id || m.reference || "—"}</td>
                      <td className="px-6 py-4 text-sm">{new Date(m.date).toLocaleString("fr-FR")}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const cls =
                            m.type === "entry"
                              ? "bg-green-100 text-green-700"
                              : m.type === "exit"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700";
                          const label = m.type === "entry" ? "ENTRÉE" : m.type === "exit" ? "SORTIE" : "TRANSFERT";
                          return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>{label}</span>;
                        })()}
                      </td>
                      <td
                        className={`px-6 py-4 font-bold ${
                          m.type === "entry" ? "text-success" : m.type === "exit" ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {m.type === "entry" ? "+" : m.type === "exit" ? "-" : ""}
                        {m.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                            {getInitials(m.profile?.full_name ?? m.requester_name)}
                          </div>
                          <span className="text-sm">{m.profile?.full_name ?? m.requester_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground truncate">{m.document || "—"}</td>
                    </tr>
                  ))}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Aucun mouvement disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredMovements.length > 8 && (
              <div className="p-4 bg-muted/50 flex justify-center">
                <button onClick={() => navigate(`/reports?productId=${id}`)} className="text-xs text-primary font-bold hover:underline">
                  Voir tout l'historique ({filteredMovements.length})
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}