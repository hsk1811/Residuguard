import { LogOut, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../features/auth/useAuth";
import { roleLabel } from "../features/auth/roles";
import type { UserRole } from "../types/api";

const roleSummaries: Record<UserRole, string> = {
  FARMER: "Cattle health and farm records",
  VETERINARIAN: "Treatment and withdrawal records",
  COLLECTION_CENTRE: "Milk collection records",
  FACTORY: "Processing and package records",
  AUTHORITY: "Compliance oversight records",
};

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/sign-in" replace />;
  if (session.user.role !== role) return <Navigate to="/" replace />;

  function handleSignOut() {
    signOut();
    navigate("/sign-in", { replace: true });
  }

  return <div className="auth-page mx-auto max-w-5xl px-5 py-12">
    <div className="dashboard-heading"><div><p className="eyebrow">{roleLabel(role)} workspace</p><h1 className="auth-title">Welcome, {session.user.name}</h1><p className="auth-intro">{roleSummaries[role]}</p></div><Button variant="secondary" onClick={handleSignOut}><LogOut size={16} aria-hidden="true" /> Sign out</Button></div>
    <Card className="dashboard-notice">
      <span className="dashboard-notice-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
      <div><h2>Your account is connected.</h2><p>Role-specific records will appear here when the backend provides an authenticated, role-scoped dashboard API. This page does not expose unscoped cattle records.</p></div>
    </Card>
  </div>;
}
