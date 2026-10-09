import { useCallback, useEffect, useMemo, useState } from "react";
import { Factory, LogOut, RefreshCw } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorMessage, LoadingIndicator } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/useAuth";
import { getFactoryDashboard } from "../services/api/factory";
import type { FactoryDashboardData } from "../types/api";

export interface FactoryOutletContext {
  data: FactoryDashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function FactoryDashboardLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<FactoryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    getFactoryDashboard(session.token)
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load factory records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, version]);

  const context = useMemo(() => ({ data, loading, error, reload }), [data, loading, error, reload]);
  function handleSignOut() { signOut(); navigate("/sign-in", { replace: true }); }

  return <div className="farmer-dashboard-shell factory-dashboard-shell">
    <a className="skip-link" href="#factory-main">Skip to content</a>
    <header className="farmer-dashboard-header">
      <div className="farmer-dashboard-header-inner">
        <Link className="farmer-dashboard-brand" to="/dashboard/factory"><span><Factory size={17} aria-hidden="true" /></span><b>Factory workspace</b></Link>
        <div className="farmer-dashboard-tools"><span className="farmer-user-name">{data?.factory.factoryName ?? session?.user.name}</span>
          <Button variant="secondary" onClick={reload} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button>
          <Button variant="ghost" onClick={handleSignOut}><LogOut size={15} aria-hidden="true" /> Sign out</Button>
        </div>
      </div>
      <nav className="farmer-dashboard-nav" aria-label="Factory dashboard"><Link to="/dashboard/factory">Overview</Link><a href="#incoming-batches">Incoming milk</a><a href="#create-processing">Create processing batch</a><a href="#processing-history">Processing history</a></nav>
    </header>
    <div id="factory-main" className="farmer-dashboard-main" tabIndex={-1}>
      {loading && !data ? <LoadingIndicator label="Loading factory records" />
        : error && !data ? <div className="farmer-dashboard-error"><ErrorMessage message={error} /><Button variant="secondary" onClick={reload}>Try again</Button></div>
          : <><Outlet context={context} />{error && <ErrorMessage message={`Refresh failed: ${error}`} />}</>}
    </div>
    <p className="farmer-dashboard-disclaimer">Processing eligibility uses the source batch status and recorded withdrawal dates. It is not a laboratory residue result. Traceability links are portal records; no external blockchain confirmation is implied.</p>
  </div>;
}
