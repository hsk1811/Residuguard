import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, PawPrint, RefreshCw } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorMessage, LoadingIndicator } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/useAuth";
import { getFarmerDashboard } from "../services/api/farmer";
import type { FarmerDashboardData } from "../types/api";

export function FarmerDashboardLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const reload = useCallback(() => setRequestVersion((version) => version + 1), []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      setData(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    getFarmerDashboard(session.token)
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your farmer dashboard.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [session, requestVersion]);

  const outletContext = useMemo(() => ({ data, loading, error, reload }), [data, loading, error, reload]);

  function handleSignOut() {
    signOut();
    navigate("/sign-in", { replace: true });
  }

  return <div className="farmer-dashboard-shell">
    <a className="skip-link" href="#farmer-main">Skip to content</a>
    <header className="farmer-dashboard-header">
      <div className="farmer-dashboard-header-inner">
        <Link className="farmer-dashboard-brand" to="/dashboard/farmer"><span><PawPrint size={17} aria-hidden="true" /></span><b>Farmer workspace</b></Link>
        <div className="farmer-dashboard-tools">
          {session && <span className="farmer-user-name">{session.user.name}</span>}
          <Button variant="secondary" onClick={reload} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button>
          <Button variant="ghost" onClick={handleSignOut}><LogOut size={15} aria-hidden="true" /> Sign out</Button>
        </div>
      </div>
      <nav className="farmer-dashboard-nav" aria-label="Farmer dashboard">
        <Link to="/dashboard/farmer">Overview</Link>
        <a href="/dashboard/farmer#cattle-records">Cattle</a>
        <a href="/dashboard/farmer#withdrawal-alerts">Withdrawal alerts</a>
        <a href="/dashboard/farmer#milk-batches">Milk batches</a>
      </nav>
    </header>
    <div id="farmer-main" className="farmer-dashboard-main" tabIndex={-1}>
      {loading ? <LoadingIndicator label="Loading your farm records" />
        : error ? <div className="farmer-dashboard-error"><ErrorMessage message={error} /><p className="farmer-error-note">The dashboard requires a valid farmer session and an available backend connection.</p></div>
          : <Outlet context={outletContext} />}
    </div>
    <p className="farmer-dashboard-disclaimer">Withdrawal eligibility is derived from recorded withdrawal end dates. It does not indicate laboratory residue testing.</p>
  </div>;
}
