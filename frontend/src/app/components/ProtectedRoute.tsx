import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== "false";

export function ProtectedRoute() {
  if (!AUTH_ENABLED) return <Outlet />;

  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
