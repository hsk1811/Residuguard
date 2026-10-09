import { useEffect, useMemo, useState } from "react";
import { Activity, Beef, CircleHelp, ClipboardList, Milk, Search, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useFarmerDashboard } from "../layouts/useFarmerDashboard";
import { useAuth } from "../features/auth/useAuth";
import { getFarmerCollectionCentres, setCollectionCentreAccess } from "../services/api/collectionCentre";
import { isSafeMilkBatch, milkEligibilityForCattle } from "../features/farmer/milkEligibility";
import type { CollectionCentreDirectoryResponse, FarmerCattle, MilkBatchStatus, MilkEligibility } from "../types/api";

type CattleFilter = "ALL" | MilkEligibility;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function latestActiveWithdrawalEnd(cattle: FarmerCattle): string | null {
  const activeEnds = cattle.treatments
    .map((treatment) => treatment.withdrawalEnds)
    .filter((value): value is string => value !== null && Date.parse(value) > Date.now());
  return activeEnds.reduce<string | null>((latest, current) =>
    latest === null || Date.parse(current) > Date.parse(latest) ? current : latest, null);
}

function eligibilityLabel(value: MilkEligibility): string {
  if (value === "HOLD") return "Withdrawal hold";
  if (value === "UNVERIFIED") return "Review required";
  return "Eligible by record";
}

function statusTone(status: MilkBatchStatus): "safe" | "hold" | "neutral" {
  if (status === "SAFE") return "safe";
  if (status === "HOLD") return "hold";
  return "neutral";
}

function MetricCard({ title, value, caption, icon: Icon, tone = "forest" }: {
  title: string; value: number | null; caption: string; icon: typeof Beef; tone?: "forest" | "blue" | "brown" | "muted";
}) {
  return <article className={`farmer-metric tone-${tone}`}>
    <div className="farmer-metric-top"><span>{title}</span><Icon size={19} aria-hidden="true" /></div>
    <p className="farmer-metric-value">{value === null ? <span className="metric-unavailable">Not tracked</span> : value}</p>
    <p className="farmer-metric-caption">{caption}</p>
  </article>;
}

function CattleTable({ cattle }: { cattle: FarmerCattle[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CattleFilter>("ALL");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cattle.filter((animal) => {
      const searchMatches = !normalized || [animal.cattleId, animal.name, animal.breed, animal.sex]
        .some((value) => value?.toLowerCase().includes(normalized));
      const eligibility = milkEligibilityForCattle(animal);
      return searchMatches && (filter === "ALL" || eligibility === filter);
    });
  }, [cattle, query, filter]);

  return <section id="cattle-records" className="farmer-panel">
    <div className="farmer-panel-heading"><div><p className="eyebrow">Herd records</p><h2>Cattle</h2></div><span className="record-count">{filtered.length} shown</span></div>
    <div className="farmer-table-controls">
      <label className="farmer-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search cattle</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID, name, breed…" /></label>
      <label className="farmer-filter"><span>Milk eligibility</span><select value={filter} onChange={(event) => setFilter(event.target.value as CattleFilter)}>
        <option value="ALL">All cattle</option><option value="HOLD">Withdrawal hold</option><option value="UNVERIFIED">Review required</option><option value="ELIGIBLE_BY_RECORD">Eligible by record</option>
      </select></label>
    </div>
    {cattle.length === 0 ? <EmptyState title="No cattle records yet" description="Cattle associated with your farmer profile will appear here when they are registered." />
      : filtered.length === 0 ? <EmptyState title="No cattle match these filters" description="Try another search term or change the eligibility filter." />
        : <div className="farmer-table-scroll"><table className="farmer-table"><thead><tr><th scope="col">Animal</th><th scope="col">Breed</th><th scope="col">Last treatment</th><th scope="col">Milk eligibility</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>
          {filtered.map((animal) => {
            const latestTreatment = animal.treatments[0];
            const eligibility = milkEligibilityForCattle(animal);
            return <tr key={animal.id}><th scope="row"><span className="animal-name">{animal.name || animal.cattleId}</span><span className="animal-id">{animal.cattleId}</span></th><td>{animal.breed || "Not recorded"}</td><td>{latestTreatment ? formatDate(latestTreatment.administeredAt) : "No treatment recorded"}</td><td><StatusBadge tone={eligibility === "HOLD" ? "hold" : eligibility === "ELIGIBLE_BY_RECORD" ? "safe" : "neutral"}>{eligibilityLabel(eligibility)}</StatusBadge></td><td><Link className="table-detail-link" to={`/dashboard/farmer/cattle/${encodeURIComponent(animal.cattleId)}`}>Details <span aria-hidden="true">→</span></Link></td></tr>;
          })}
        </tbody></table></div>}
  </section>;
}

function CollectionCentreAccessPanel() {
  const { session } = useAuth();
  const [centres, setCentres] = useState<CollectionCentreDirectoryResponse["centres"]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    getFarmerCollectionCentres(session.token)
      .then((result) => { if (active) setCentres(result.centres); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load collection centres."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);

  async function updateAccess(centreId: string, grant: boolean) {
    if (!session) return;
    setSavingId(centreId);
    setError(null);
    setNotice(null);
    try {
      const result = await setCollectionCentreAccess(session.token, centreId, grant);
      setCentres((current) => current.map((centre) => centre.id === centreId
        ? { ...centre, accessGranted: grant, grantedAt: grant ? result.grant?.grantedAt ?? null : null }
        : centre));
      setNotice(grant ? "Access granted. This centre can now view your cattle sources and recorded withdrawal information." : "Access revoked. This centre can no longer select your cattle for new batches.");
    } catch (cause) {
      setError(cause instanceof Error ? `${cause.message} The server did not confirm this access change.` : "The server did not confirm this access change.");
    } finally {
      setSavingId(null);
    }
  }

  return <section className="farmer-panel collection-access-panel" id="collection-access">
    <div className="farmer-panel-heading"><div><p className="eyebrow">Supplier permissions</p><h2>Collection centre access</h2></div><UsersRound size={19} aria-hidden="true" /></div>
    <p className="collection-access-intro">Grant a collection centre access to your cattle and treatment withdrawal records so it can record milk sources. You can revoke access at any time.</p>
    {error && <ErrorMessage message={error} />}
    {notice && <p className="collection-access-notice" role="status">{notice}</p>}
    {loading ? <p className="collection-access-empty" role="status">Loading collection centres…</p>
      : centres.length === 0 ? <EmptyState title="No collection centres registered" description="Registered collection centres will appear here when available." />
        : <ul className="collection-access-list">{centres.map((centre) => <li key={centre.id}>
          <div><b>{centre.centreName}</b><span>{centre.registrationNumber} · {centre.village || centre.address}</span><small>{centre.accessGranted ? "This centre can view your cattle source records." : "This centre cannot view your cattle records."}</small></div>
          <Button variant={centre.accessGranted ? "secondary" : "primary"} disabled={savingId !== null} onClick={() => void updateAccess(centre.id, !centre.accessGranted)}>
            {savingId === centre.id ? "Saving…" : centre.accessGranted ? "Revoke access" : "Grant access"}
          </Button>
        </li>)}</ul>}
  </section>;
}

export function FarmerDashboardPage() {
  const { data, error, reload } = useFarmerDashboard();
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState title="Farm records unavailable" description="The dashboard did not receive farmer records from the server." />;

  const holdCattle = data.cattle.filter((animal) => milkEligibilityForCattle(animal) === "HOLD");
  const reviewCattle = data.cattle.filter((animal) => milkEligibilityForCattle(animal) === "UNVERIFIED");
  const safeBatches = data.milkBatches.filter(isSafeMilkBatch);

  return <div className="farmer-overview">
    <section className="farmer-welcome"><div><p className="eyebrow">Farmer dashboard</p><h1>Good to see you, {data.farmer.name}</h1><p>{data.farmer.village} · Your cattle health, treatment and milk records.</p></div><span className="farmer-welcome-icon"><Beef size={26} aria-hidden="true" /></span></section>

    <section aria-label="Farm summary" className="farmer-metrics-grid">
      <MetricCard title="Total cattle" value={data.summary.totalCattle} caption="Registered to your farmer profile" icon={Beef} />
      <MetricCard title="Healthy / active cattle" value={data.summary.healthyCattle} caption="Health status is not recorded by the backend" icon={Activity} tone="blue" />
      <MetricCard title="Under treatment" value={data.summary.underTreatmentCattle} caption="Active treatment status is not recorded" icon={ClipboardList} tone="brown" />
      <MetricCard title="Withdrawal HOLD" value={data.summary.withdrawalHoldCattle} caption="Cattle with a withdrawal end date in the future" icon={ShieldAlert} tone="brown" />
      <MetricCard title="SAFE milk batches" value={safeBatches.length} caption="Batches marked SAFE in the database" icon={Milk} tone="blue" />
    </section>

    <section id="withdrawal-alerts" className="farmer-alert-grid" aria-label="Treatment and withdrawal alerts">
      <article className="farmer-alert-card alert-hold"><div className="farmer-alert-title"><ShieldAlert size={18} aria-hidden="true" /><h2>Withdrawal holds</h2><span>{holdCattle.length}</span></div>
        {holdCattle.length === 0 ? <p>No cattle currently have a future withdrawal end date in their records.</p> : <ul>{holdCattle.map((animal) => <li key={animal.id}><Link to={`/dashboard/farmer/cattle/${encodeURIComponent(animal.cattleId)}`}>{animal.name || animal.cattleId}</Link><span>{animal.cattleId}{latestActiveWithdrawalEnd(animal) ? ` · hold until ${formatDate(latestActiveWithdrawalEnd(animal)!)}` : ""}</span></li>)}</ul>}
      </article>
      <article className="farmer-alert-card alert-review"><div className="farmer-alert-title"><CircleHelp size={18} aria-hidden="true" /><h2>Review needed</h2><span>{reviewCattle.length}</span></div>
        {reviewCattle.length === 0 ? <p>No treatment records are missing a withdrawal end date.</p> : <ul>{reviewCattle.map((animal) => <li key={animal.id}><Link to={`/dashboard/farmer/cattle/${encodeURIComponent(animal.cattleId)}`}>{animal.name || animal.cattleId}</Link><span>A treatment has no recorded withdrawal end date.</span></li>)}</ul>}
      </article>
    </section>

    <CattleTable cattle={data.cattle} />

    <CollectionCentreAccessPanel />

    <section id="milk-batches" className="farmer-panel">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Collection records</p><h2>Milk batches</h2></div><span className="record-count">{data.milkBatches.length} linked</span></div>
      {data.milkBatches.length === 0 ? <EmptyState title="No linked milk batches" description="Milk batches linked to your cattle will appear here when the collection centre records them." />
        : <div className="farmer-table-scroll"><table className="farmer-table"><thead><tr><th scope="col">Batch ID</th><th scope="col">Collection date</th><th scope="col">Volume</th><th scope="col">Animals linked</th><th scope="col">Status</th></tr></thead><tbody>
          {data.milkBatches.map((batch) => <tr key={batch.id}><th scope="row"><span className="animal-name">{batch.batchId}</span></th><td>{formatDate(batch.date)}</td><td>{batch.volumeL.toLocaleString()} L</td><td>{batch.contributingAnimals.length}</td><td><StatusBadge tone={statusTone(batch.status)}>{batch.status}</StatusBadge></td></tr>)}
        </tbody></table></div>}
      <p className="milk-safety-note"><ShieldCheck size={15} aria-hidden="true" /> SAFE is the recorded batch status. It does not mean this portal performed laboratory residue testing.</p>
    </section>

    <p className="farmer-updated-at">Records loaded at {formatDate(data.generatedAt)}. <button type="button" onClick={reload}>Refresh records</button></p>
  </div>;
}
