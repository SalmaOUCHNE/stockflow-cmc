import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, roles } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = roles.some((role) => role?.toString().toLowerCase() === "admin");
  return <Navigate to={isAdmin ? "/dashboard" : "/portal/dashboard"} replace />;
};

export default Index;
