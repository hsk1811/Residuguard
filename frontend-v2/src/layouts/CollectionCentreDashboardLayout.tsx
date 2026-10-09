import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Milk, RefreshCw } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorMessage, LoadingIndicator } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/useAuth";
import { getCollectionCentreDashboard } from "../services/api/collectionCentre";
import type { CollectionCentreDashboardData } from "../types/api";

export interface CollectionCentreOutletContext {
  data: CollectionCentreDashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function CollectionCentreDashboardLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CollectionCentreDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    getCollectionCentreDashboard(session.token)
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load collection records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, version]);

  const context = useMemo(() => ({ data, loading, error, reload }), [data, loading, error, reload]);
  function handleSignOut() { signOut(); navigate("/sign-in", { replace: true }); }

  return <div className="farmer-dashboard-shell collection-dashboard-shell">
    <a className="skip-link" href="#collection-main">Skip to content</a>
    <header className="farmer-dashboard-header">
      <div className="farmer-dashboard-header-inner">
        <Link className="farmer-dashboard-brand" to="/dashboard/collection-centre"><span><Milk size={17} aria-hidden="true" /></span><b>Collection workspace</b></Link>
        <div className="farmer-dashboard-tools">
          <span className="farmer-user-name">{data?.centre.centreName ?? session?.user.name}</span>
          <Button variant="secondary" onClick={reload} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button>
          <Button variant="ghost" onClick={handleSignOut}><LogOut size={15} aria-hidden="true" /> Sign out</Button>
        </div>
      </div>
      <nav className="farmer-dashboard-nav" aria-label="Collection centre dashboard">
        <Link to="/dashboard/collection-centre">Overview</Link>
        <a href="#new-collection">Record collection</a>
        <a href="#batch-history">Batch history</a>
      </nav>
    </header>
    <div id="collection-main" className="farmer-dashboard-main" tabIndex={-1}>
      {loading && !data ? <LoadingIndicator label="Loading collection centre records" />
        : error && !data ? <div className="farmer-dashboard-error"><ErrorMessage message={error} /><Button variant="secondary" onClick={reload}>Try again</Button></div>
          : <><Outlet context={context} />{error && <ErrorMessage message={`Refresh failed: ${error}`} />}</>}
    </div>
    <p className="farmer-dashboard-disclaimer">Eligibility is determined from recorded withdrawal dates only. A recorded eligible status is not a laboratory residue result; no external blockchain confirmation is implied.</p>
  </div>;
}
