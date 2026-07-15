import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Signup from "./pages/Signup.tsx";
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Stock = lazy(() => import("./pages/Stock.tsx"));
const ItemDetail = lazy(() => import("./pages/ItemDetail.tsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.tsx"));
const Entries = lazy(() => import("./pages/Entries.tsx"));
const Exits = lazy(() => import("./pages/Exits.tsx"));
const Reports = lazy(() => import("./pages/Reports.tsx"));
const Users = lazy(() => import("./pages/Users.tsx"));
const SettingsPage = lazy(() => import("./pages/Settings.tsx"));
const Bons = lazy(() => import("./pages/Bons.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const AuditLog = lazy(() => import("./pages/AuditLog.tsx"));
const Expirations = lazy(() => import("./pages/Expirations.tsx"));
import AppLayout from "./components/app/AppLayout";
import ProtectedRoute from "./components/app/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalCatalogue = lazy(() => import("./pages/portal/PortalCatalogue"));
const PortalProductDetail = lazy(() => import("./pages/portal/PortalProductDetail"));
const PortalNouvelleDemande = lazy(() => import("./pages/portal/PortalNouvelleDemande"));
const PortalMesDemandes = lazy(() => import("./pages/portal/PortalMesDemandes"));
const PortalHistorique = lazy(() => import("./pages/portal/PortalHistorique"));
const PortalNotifications = lazy(() => import("./pages/portal/PortalNotifications"));
const PortalProfil = lazy(() => import("./pages/portal/PortalProfil"));

import queryClient from "@/services/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement de l'application...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute adminOnly><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/stock/new" element={<ItemDetail />} />
                <Route path="/stock/:id" element={<ProductDetails />} />
                {/* Backwards-compatible catalogue routes for product detail/edit */}
                <Route path="/catalogue/:id" element={<ProductDetails />} />
                <Route path="/catalogue/edit/:id" element={<ItemDetail />} />
                <Route path="/products/:id/edit" element={<ItemDetail />} />
                <Route path="/entries" element={<Entries />} />
                <Route path="/entries/new" element={<Entries />} />
                <Route path="/exits" element={<Exits />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/bons" element={<Bons />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/expirations" element={<Expirations />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route element={<ProtectedRoute nonAdminOnly><PortalLayout /></ProtectedRoute>}>
                <Route path="/portal" element={<PortalDashboard />} />
                <Route path="/portal/dashboard" element={<PortalDashboard />} />
                <Route path="/portal/catalogue" element={<PortalCatalogue />} />
                <Route path="/portal/produit/:id" element={<PortalProductDetail />} />
                <Route path="/portal/nouvelle-demande" element={<PortalNouvelleDemande />} />
                <Route path="/portal/mes-demandes" element={<PortalMesDemandes />} />
                <Route path="/portal/historique" element={<PortalHistorique />} />
                <Route path="/portal/notifications" element={<PortalNotifications />} />
                <Route path="/portal/profil" element={<PortalProfil />} />
              </Route>
              <Route element={<ProtectedRoute adminOnly><AppLayout /></ProtectedRoute>}>
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<Users />} />
                <Route path="/audit" element={<AuditLog />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
