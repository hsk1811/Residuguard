import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../../types/api";
import { useAuth } from "./useAuth";
import { roleGuardDestination } from "./roles";

export function RequireRole({ allowedRole, children }: { allowedRole: UserRole; children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  const destination = roleGuardDestination(session?.user.role ?? null, allowedRole);
  if (destination) return <Navigate to={destination} replace state={{ from: location.pathname }} />;
  return children;
}
