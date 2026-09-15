import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== "false";

export function RoleBasedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  if (!AUTH_ENABLED) return <Outlet />;

  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowed = user?.roles.some((role) => allowedRoles.includes(role));
  return allowed ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

export function AdminRoute() {
  return <RoleBasedRoute allowedRoles={["ADMIN"]} />;
}

export function TouristRoute() {
  return <RoleBasedRoute allowedRoles={["TOURIST"]} />;
}
