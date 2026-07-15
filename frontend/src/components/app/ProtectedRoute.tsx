import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function ProtectedRoute({ children, adminOnly, nonAdminOnly }: { children: ReactNode; adminOnly?: boolean; nonAdminOnly?: boolean }) {
  const { user, loading, roles } = useAuth();
  const isAdmin = roles.some((role) => role?.toString().toLowerCase() === "admin");

  if (loading) {
    console.log('[ProtectedRoute] auth loading, waiting for auth state');
    return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!user) {
    console.log('[ProtectedRoute] no authenticated user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('[ProtectedRoute] user is not admin, redirecting to /portal/dashboard');
    return <Navigate to="/portal/dashboard" replace />;
  }

  if (nonAdminOnly && isAdmin) {
    console.log('[ProtectedRoute] admin trying to access non-admin route, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[ProtectedRoute] access granted', { adminOnly, nonAdminOnly, isAdmin });
  return <>{children}</>;
}