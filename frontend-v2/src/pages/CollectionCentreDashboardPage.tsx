import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Milk, RefreshCw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { FormField } from "../components/ui/FormField";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useCollectionCentreDashboard } from "../layouts/useCollectionCentreDashboard";
import { createCollectionMilkBatch } from "../services/api/collectionCentre";
import { useAuth } from "../features/auth/useAuth";
import type { CollectionCentreSource, CollectionMilkBatch, MilkEligibility } from "../types/api";

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function localDateTimeValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function sourceLabel(source: CollectionCentreSource): string {
  return source.name || source.cattleId;
}

function Metric({ title, value, caption, icon: Icon, tone = "forest" }: {
  title: string; value: string; caption: string; icon: typeof Milk; tone?: "forest" | "blue" | "brown";
}) {
  return <article className={`farmer-metric tone-${tone}`}><div className="farmer-metric-top"><span>{title}</span><Icon size={19} aria-hidden="true" /></div><p className="farmer-metric-value">{value}</p><p className="farmer-metric-caption">{caption}</p></article>;
}

function EligibilityBadge({ status }: { status: MilkEligibility }) {
  if (status === "ELIGIBLE_BY_RECORD") return <StatusBadge tone="safe">Eligible by record</StatusBadge>;
  return <StatusBadge tone={status === "HOLD" ? "hold" : "neutral"}>{status === "HOLD" ? "Withdrawal HOLD" : "Eligibility unverified"}</StatusBadge>;
}

function BatchCard({ batch }: { batch: CollectionMilkBatch }) {
  return <article className="collection-batch-card">
    <div className="collection-batch-heading"><div><p className="eyebrow">Milk batch</p><h3>{batch.batchId}</h3></div><StatusBadge tone={batch.eligibility === "ELIGIBLE_BY_RECORD" ? "safe" : "hold"}>{batch.eligibility === "ELIGIBLE_BY_RECORD" ? "Eligible by record" : "HOLD"}</StatusBadge></div>
    <dl className="collection-batch-facts"><div><dt>Collected</dt><dd>{formatDateTime(batch.date)}</dd></div><div><dt>Quantity</dt><dd>{batch.volumeL.toLocaleString()} L</dd></div><div><dt>Recorded status</dt><dd>{batch.status}</dd></div></dl>
    <div className="collection-batch-sources"><b>Sources</b><ul>{batch.contributors.map((source) => <li key={source.id}><span>{source.farmer.user.name} · {source.name || source.cattleId} ({source.cattleId})</span><EligibilityBadge status={source.eligibility} /></li>)}</ul></div>
    <details className="collection-trace-details"><summary>Traceability record ({batch.traceability.length} events)</summary>
      <p>Source lineage links this batch to the recorded farmer and cattle records.</p>
      {batch.traceability.length === 0 ? <p>No portal traceability event was recorded for this batch.</p> : <ol>{batch.traceability.map((event, index) => <li key={event.id ?? `${event.eventType}-${event.createdAt}-${index}`}><b>{event.eventType.replaceAll("_", " ")}</b><span>{formatDateTime(event.createdAt)}</span>{event.blockchainTxId ? <span>External transaction: {event.blockchainTxId}</span> : <span>Portal record only; no external blockchain confirmation.</span>}</li>)}</ol>}
    </details>
  </article>;
}

export function CollectionCentreDashboardPage() {
  const { session } = useAuth();
  const { data, error, reload } = useCollectionCentreDashboard();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [volume, setVolume] = useState("");
  const [date, setDate] = useState(localDateTimeValue);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedBatch, setConfirmedBatch] = useState<CollectionMilkBatch | null>(null);

  const sources = useMemo(() => data?.sources ?? [], [data?.sources]);
  const selectedSources = useMemo(() => sources.filter((source) => selectedIds.includes(source.cattleId)), [sources, selectedIds]);
  const ineligibleSources = selectedSources.filter((source) => source.eligibility !== "ELIGIBLE_BY_RECORD");
  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sources;
    return sources.filter((source) => [source.cattleId, source.name, source.farmer.user.name, source.farmer.village]
      .some((value) => value?.toLowerCase().includes(normalized)));
  }, [sources, query]);

  function toggleSource(cattleId: string) {
    setSelectedIds((current) => current.includes(cattleId) ? current.filter((id) => id !== cattleId) : [...current, cattleId]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!selectedIds.length) { setFormError("Select at least one farmer cattle source."); return; }
    if (!Number.isFinite(Number(volume)) || Number(volume) <= 0) { setFormError("Enter a collection quantity greater than zero litres."); return; }
    if (!date || !Number.isFinite(Date.parse(date))) { setFormError("Enter a valid collection date and time."); return; }
    if (ineligibleSources.length) setConfirmOpen(true);
    else void saveBatch();
  }

  async function saveBatch() {
    if (!session) return;
    setConfirmOpen(false);
    setSaving(true);
    setFormError(null);
    try {
      const response = await createCollectionMilkBatch(session.token, {
        cattleIds: selectedIds,
        volumeL: Number(volume),
        date: new Date(date).toISOString(),
      });
      const contributorMap = new Map(selectedSources.map((source) => [source.cattleId, source]));
      const serverWarningMap = new Map(response.warnings.map((warning) => [warning.cattleId, warning.eligibility]));
      const saved: CollectionMilkBatch = {
        ...response.batch,
        eligibility: response.batch.status === "SAFE" && response.warnings.length === 0 ? "ELIGIBLE_BY_RECORD" : "HOLD",
        contributors: response.batch.contributors.map((source) => ({
          ...source,
          eligibility: serverWarningMap.get(source.cattleId) ?? contributorMap.get(source.cattleId)?.eligibility ?? "UNVERIFIED",
        })),
      };
      setConfirmedBatch(saved);
      setSelectedIds([]);
      setVolume("");
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error
        ? `${cause.message} The server did not confirm this batch; check batch history before retrying.`
        : "The server did not confirm this batch. Check batch history before retrying.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <EmptyState title="Collection records unavailable" description="Collection centre data was not returned by the server." />;

  return <div className="collection-dashboard">
    <section className="farmer-welcome"><div><p className="eyebrow">Collection centre dashboard</p><h1>{data.centre.centreName}</h1><p>{data.centre.village || "Location not recorded"} · Collection records for {data.centre.name}.</p></div><span className="farmer-welcome-icon"><Milk size={26} aria-hidden="true" /></span></section>

    <section className="farmer-metrics-grid collection-metrics" aria-label="Today's collection summary">
      <Metric title="Today's collection" value={`${data.summary.todaysCollectionL.toLocaleString()} L`} caption={`${data.summary.todaysBatches} batches recorded today`} icon={Milk} />
      <Metric title="Eligible by record" value={`${data.summary.eligibleMilkL.toLocaleString()} L`} caption="Withdrawal dates recorded as complete at collection" icon={ShieldCheck} tone="blue" />
      <Metric title="HOLD / review sources" value={String(data.summary.holdSources)} caption="Sources with active or unverified withdrawal records" icon={ShieldX} tone="brown" />
      <Metric title="Today's batches" value={String(data.summary.todaysBatches)} caption="Batches recorded by this centre" icon={ClipboardList} />
    </section>

    <section className="collection-form-panel" id="new-collection">
      <div className="farmer-panel-heading"><div><p className="eyebrow">New collection</p><h2>Record a milk batch</h2></div><span className="record-count">Batch ID assigned by server</span></div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="collection-form-grid">
          <FormField id="collection-volume" name="volume" label="Quantity collected (litres)" type="number" min="0.01" step="0.01" required value={volume} onChange={(event) => setVolume(event.target.value)} placeholder="Enter litres" />
          <FormField id="collection-date" name="date" label="Collection date and time" type="datetime-local" required value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="collection-source-header"><div><h3>Farmer and cattle sources</h3><p>Select the animals contributing to this batch. Eligibility is rechecked by the backend when you submit.</p></div><span className="record-count">{selectedIds.length} selected</span></div>
        <label className="farmer-search collection-source-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search farmers or cattle</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search farmer, village, or Cow ID" /></label>

        {sources.length === 0 ? <EmptyState title="No cattle sources available" description="The backend returned no cattle and farmer records for source selection." />
          : filteredSources.length === 0 ? <EmptyState title="No sources match" description="Try searching with another farmer name, village, or Cow ID." />
            : <div className="collection-source-list">{filteredSources.map((source) => <label className={`collection-source-option ${source.eligibility !== "ELIGIBLE_BY_RECORD" ? "source-ineligible" : ""}`} key={source.id}>
              <input type="checkbox" checked={selectedIds.includes(source.cattleId)} onChange={() => toggleSource(source.cattleId)} aria-label={`Select ${source.farmer.user.name}, cow ${source.cattleId}`} />
              <span className="collection-source-main"><b>{source.farmer.user.name}</b><span>{source.farmer.village || "Village not recorded"} · {sourceLabel(source)} · Cow ID {source.cattleId}</span></span>
              <EligibilityBadge status={source.eligibility} />
            </label>)}</div>}

        {ineligibleSources.length > 0 && <div className="collection-warning" role="alert"><AlertTriangle size={18} aria-hidden="true" /><div><b>{ineligibleSources.length} selected source{ineligibleSources.length === 1 ? "" : "s"} need review.</b><p>This batch cannot receive an eligible SAFE status. The backend will record it as HOLD if these sources remain ineligible at collection time.</p></div></div>}
        {formError && <ErrorMessage message={formError} />}
        <div className="collection-form-actions"><p><Clock3 size={15} aria-hidden="true" /> SAFE means eligible by recorded withdrawal dates only; it is not a residue test result.</p><Button type="submit" disabled={saving || selectedIds.length === 0}>{saving ? "Saving batch…" : "Record collection"}</Button></div>
      </form>
    </section>

    {confirmedBatch && <section className="collection-saved-notice" role="status"><CheckCircle2 size={20} aria-hidden="true" /><div><b>Server confirmed batch {confirmedBatch.batchId}.</b><span> Recorded as {confirmedBatch.eligibility === "ELIGIBLE_BY_RECORD" ? "eligible by record" : "HOLD"}; quantity {confirmedBatch.volumeL.toLocaleString()} L.</span></div><button type="button" onClick={() => setConfirmedBatch(null)} aria-label="Dismiss saved batch notice">Dismiss</button></section>}
    {error && <ErrorMessage message={`Dashboard refresh failed: ${error}`} />}

    <section className="farmer-panel collection-history-panel" id="batch-history">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Recent records</p><h2>Milk batch history</h2></div><Button variant="secondary" onClick={reload}><RefreshCw size={15} aria-hidden="true" /> Refresh history</Button></div>
      {data.batches.length === 0 ? <EmptyState title="No milk batches recorded" description="Batches confirmed by this centre will appear here with source and traceability details." />
        : <div className="collection-batch-list">{data.batches.map((batch) => <BatchCard key={batch.id} batch={batch} />)}</div>}
    </section>

    <ConfirmDialog open={confirmOpen} title="Record this batch as HOLD?" onCancel={() => setConfirmOpen(false)} onConfirm={() => void saveBatch()} confirmLabel="Record HOLD batch">
      <p>{ineligibleSources.length} selected source{ineligibleSources.length === 1 ? " has" : "s have"} an active withdrawal or unverified record. The server checks sources again and will not mark this batch eligible.</p>
      <ul className="collection-dialog-sources">{ineligibleSources.map((source) => <li key={source.id}>{source.farmer.user.name} · Cow {source.cattleId}: {source.eligibility === "HOLD" ? "withdrawal hold" : "eligibility unverified"}</li>)}</ul>
    </ConfirmDialog>
  </div>;
}
