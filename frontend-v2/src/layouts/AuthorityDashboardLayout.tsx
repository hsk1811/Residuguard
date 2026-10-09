import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorMessage, LoadingIndicator } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/useAuth";
import { getAuthorityDashboard } from "../services/api/authority";
import type { AuthorityDashboardData } from "../types/api";

export interface AuthorityOutletContext {
  data: AuthorityDashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function AuthorityDashboardLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AuthorityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    getAuthorityDashboard(session.token)
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load administrative records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, version]);

  const context = useMemo(() => ({ data, loading, error, reload }), [data, loading, error, reload]);
  function handleSignOut() { signOut(); navigate("/sign-in", { replace: true }); }

  return <div className="farmer-dashboard-shell authority-dashboard-shell">
    <a className="skip-link" href="#authority-main">Skip to content</a>
    <header className="farmer-dashboard-header">
      <div className="farmer-dashboard-header-inner">
        <Link className="farmer-dashboard-brand" to="/dashboard/authority"><span><ShieldCheck size={17} aria-hidden="true" /></span><b>Authority workspace</b></Link>
        <div className="farmer-dashboard-tools"><span className="farmer-user-name">{session?.user.name}</span>
          <Button variant="secondary" onClick={reload} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button>
          <Button variant="ghost" onClick={handleSignOut}><LogOut size={15} aria-hidden="true" /> Sign out</Button>
        </div>
      </div>
      <nav className="farmer-dashboard-nav" aria-label="Authority dashboard"><Link to="/dashboard/authority">Overview</Link><a href="#users-roles">Users and roles</a><a href="#compliance">Compliance</a><a href="#batches">Batches</a><a href="#traceability">Traceability</a></nav>
    </header>
    <div id="authority-main" className="farmer-dashboard-main" tabIndex={-1}>
      {loading && !data ? <LoadingIndicator label="Loading authorized oversight records" />
        : error && !data ? <div className="farmer-dashboard-error"><ErrorMessage message={error} /><p className="farmer-error-note">Administrative access requires an AUTHORITY account ID listed in the backend’s AUTHORITY_ADMIN_USER_IDS configuration.</p><Button variant="secondary" onClick={reload}>Try again</Button></div>
          : <><Outlet context={context} />{error && <ErrorMessage message={`Refresh failed: ${error}`} />}</>}
    </div>
    <p className="farmer-dashboard-disclaimer"><Activity size={14} aria-hidden="true" /> Compliance figures use stored records and withdrawal dates. They do not represent laboratory residue detection. Blockchain fields are stored metadata only; external chain verification is unavailable.</p>
  </div>;
}
