import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Factory, History, Milk, PackageCheck, RefreshCw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { FormField } from "../components/ui/FormField";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../features/auth/useAuth";
import { useOutletContext } from "react-router-dom";
import type { FactoryOutletContext } from "../layouts/FactoryDashboardLayout";
import { createFactoryProcessingBatch } from "../services/api/factory";
import type { FactoryMilkBatch, FactoryProcessingBatch, MilkBatchStatus } from "../types/api";

const EMPTY_INCOMING: FactoryMilkBatch[] = [];
const EMPTY_HISTORY: FactoryProcessingBatch[] = [];

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function localDateTimeValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Metric({ title, value, caption, icon: Icon, tone = "forest" }: { title: string; value: string; caption: string; icon: typeof Milk; tone?: "forest" | "blue" | "brown" }) {
  return <article className={`farmer-metric tone-${tone}`}><div className="farmer-metric-top"><span>{title}</span><Icon size={19} aria-hidden="true" /></div><p className="farmer-metric-value">{value}</p><p className="farmer-metric-caption">{caption}</p></article>;
}

function statusTone(status: MilkBatchStatus) {
  return status === "SAFE" ? "safe" as const : status === "HOLD" ? "hold" as const : "neutral" as const;
}

function SourceLineage({ source }: { source: FactoryMilkBatch }) {
  return <li><div><b>{source.batchId}</b><span>{source.volumeL.toLocaleString()} L · {source.collectionCentre ?? "Centre profile incomplete"} · {formatDateTime(source.date)}</span>
    <small>{source.sourceCount} contributing cattle record{source.sourceCount === 1 ? "" : "s"}</small></div>
    <StatusBadge tone={source.eligibility === "ELIGIBLE_BY_RECORD" ? "safe" : "hold"}>{source.eligibility === "ELIGIBLE_BY_RECORD" ? "Eligible by record" : "HOLD / review"}</StatusBadge></li>;
}

function ProcessingCard({ batch }: { batch: FactoryProcessingBatch }) {
  return <article className="factory-processing-card">
    <div className="collection-batch-heading"><div><p className="eyebrow">Processing batch</p><h3>{batch.batchId}</h3></div><StatusBadge tone={batch.status === "COMPLETED" || batch.status === "DISPATCHED" ? "safe" : batch.status === "HOLD" ? "hold" : "neutral"}>{batch.status.replaceAll("_", " ")}</StatusBadge></div>
    <dl className="collection-batch-facts"><div><dt>Processing date</dt><dd>{formatDateTime(batch.date)}</dd></div><div><dt>Input quantity</dt><dd>{batch.volumeL.toLocaleString()} L</dd></div><div><dt>Product / packs</dt><dd>{batch.product} · {batch.packs.toLocaleString()} packs</dd></div></dl>
    <div className="factory-genealogy"><div className="factory-genealogy-title"><History size={15} aria-hidden="true" /><b>Source genealogy ({batch.sources.length})</b></div>
      <ul>{batch.sources.map((source) => <SourceLineage key={source.id} source={source} />)}</ul>
    </div>
    <p className="factory-created-at">Recorded {formatDateTime(batch.createdAt)}</p>
  </article>;
}

export function FactoryDashboardPage() {
  const { session } = useAuth();
  const { data, error, reload } = useOutletContext<FactoryOutletContext>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [packs, setPacks] = useState("");
  const [date, setDate] = useState(localDateTimeValue);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedBatch, setConfirmedBatch] = useState<FactoryProcessingBatch | null>(null);

  const incoming = data?.incoming ?? EMPTY_INCOMING;
  const eligibleBatches = useMemo(() => incoming.filter((batch) => batch.available && batch.eligibility === "ELIGIBLE_BY_RECORD"), [incoming]);
  const selectedBatches = useMemo(() => eligibleBatches.filter((batch) => selected.includes(batch.batchId)), [eligibleBatches, selected]);
  const selectedVolume = selectedBatches.reduce((sum, batch) => sum + batch.volumeL, 0);
  const filteredIncoming = useMemo(() => {
    const search = query.trim().toLowerCase();
    return incoming.filter((batch) => {
      const matchesQuery = !search || [batch.batchId, batch.collectionCentre ?? ""].some((value) => value.toLowerCase().includes(search));
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "SAFE" ? batch.eligibility === "ELIGIBLE_BY_RECORD" : batch.eligibility !== "ELIGIBLE_BY_RECORD");
      return matchesQuery && matchesStatus;
    });
  }, [incoming, query, statusFilter]);
  const history = data?.processingBatches ?? EMPTY_HISTORY;
  const filteredHistory = useMemo(() => {
    const search = historyQuery.trim().toLowerCase();
    return history.filter((batch) => (historyStatus === "ALL" || batch.status === historyStatus)
      && (!search || [batch.batchId, batch.product, ...batch.sources.map((source) => source.batchId)].some((value) => value.toLowerCase().includes(search))));
  }, [history, historyQuery, historyStatus]);

  function toggleBatch(batch: FactoryMilkBatch) {
    if (!batch.available || batch.eligibility !== "ELIGIBLE_BY_RECORD") return;
    setSelected((current) => current.includes(batch.batchId) ? current.filter((id) => id !== batch.batchId) : [...current, batch.batchId]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!selected.length) { setFormError("Select at least one eligible incoming Milk Batch ID."); return; }
    if (!product.trim()) { setFormError("Enter the processed product name."); return; }
    if (!Number.isInteger(Number(packs)) || Number(packs) < 1) { setFormError("Enter a whole pack count greater than zero."); return; }
    if (!date || !Number.isFinite(Date.parse(date)) || new Date(date).getTime() > Date.now()) { setFormError("Enter a valid processing date and time that is not in the future."); return; }
    setConfirmOpen(true);
  }

  async function saveBatch() {
    if (!session) { setFormError("Your session expired. Sign in again to create a processing batch."); return; }
    setConfirmOpen(false);
    setSaving(true);
    setFormError(null);
    setConfirmedBatch(null);
    try {
      const response = await createFactoryProcessingBatch(session.token, {
        milkBatchIds: selected,
        date: new Date(date).toISOString(),
        product: product.trim(),
        packs: Number(packs),
      });
      setConfirmedBatch(response.processingBatch);
      setSelected([]);
      setProduct("");
      setPacks("");
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error
        ? `${cause.message} The server did not confirm this processing batch.`
        : "The server did not confirm this processing batch. Check processing history before retrying.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <EmptyState title="Factory records unavailable" description={error ?? "Factory dashboard data was not returned by the server."} />;

  return <div className="factory-dashboard">
    <section className="farmer-welcome"><div><p className="eyebrow">Factory dashboard</p><h1>{data.factory.factoryName}</h1><p>Review available milk batches, check recorded source status, and link eligible inputs to processing records.</p></div><span className="farmer-welcome-icon"><Factory size={25} aria-hidden="true" /></span></section>

    <section className="farmer-metrics-grid factory-metrics" aria-label="Factory summary">
      <Metric title="Incoming batches" value={String(data.summary.incomingBatches)} caption="Unlinked source records available" icon={Milk} />
      <Metric title="Eligible incoming" value={`${data.summary.eligibleIncomingL.toLocaleString()} L`} caption="Eligible by recorded withdrawal data" icon={ShieldCheck} tone="blue" />
      <Metric title="HOLD / review" value={String(data.summary.holdIncoming)} caption="Unavailable for eligible processing" icon={ShieldX} tone="brown" />
      <Metric title="Processing history" value={`${data.summary.processedBatches} batches`} caption={`${data.summary.processedVolumeL.toLocaleString()} L recorded`} icon={PackageCheck} />
    </section>

    <section className="farmer-panel factory-incoming-panel" id="incoming-batches">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Available supply</p><h2>Incoming milk batches</h2></div><Button variant="secondary" onClick={reload}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button></div>
      <div className="farmer-table-controls"><label className="farmer-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search incoming milk batches</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search MBID, centre, farmer, or Cow ID" /></label>
        <label className="farmer-filter"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All incoming</option><option value="SAFE">Eligible by record</option><option value="HOLD">HOLD / review</option></select></label>
      </div>
      {incoming.length === 0 ? <EmptyState title="No incoming milk batches" description="Milk batches recorded by collection centres will appear here when the backend returns them." />
        : filteredIncoming.length === 0 ? <EmptyState title="No batches match" description="Try another search or status filter." />
          : <div className="farmer-table-wrap"><table className="farmer-table"><thead><tr><th scope="col">Select</th><th scope="col">Milk Batch ID</th><th scope="col">Quantity</th><th scope="col">Collected</th><th scope="col">Source centre</th><th scope="col">Source status</th><th scope="col">Source records</th></tr></thead><tbody>{filteredIncoming.map((batch) => {
            const canSelect = batch.available && batch.eligibility === "ELIGIBLE_BY_RECORD";
            return <tr key={batch.id} className={!canSelect ? "factory-row-ineligible" : undefined}><td><input type="checkbox" aria-label={`Select ${batch.batchId} for processing`} checked={selected.includes(batch.batchId)} disabled={!canSelect} onChange={() => toggleBatch(batch)} /></td><td><b>{batch.batchId}</b>{!batch.available && <small className="factory-unavailable-note">Already linked to a processing batch</small>}</td><td>{batch.volumeL.toLocaleString()} L</td><td>{formatDateTime(batch.date)}</td><td>{batch.collectionCentre ?? "Centre profile incomplete"}{!batch.collectionCentreProfileComplete && <small className="factory-eligibility-note">Legacy / incomplete profile</small>}</td><td><StatusBadge tone={statusTone(batch.recordedStatus)}>{batch.recordedStatus}</StatusBadge><small className="factory-eligibility-note">{batch.eligibility === "ELIGIBLE_BY_RECORD" ? "Eligible by record" : "HOLD / review"}</small></td><td>{batch.sourceCount} cattle record{batch.sourceCount === 1 ? "" : "s"}</td></tr>;
          })}</tbody></table></div>}
      {incoming.some((batch) => batch.available && batch.eligibility !== "ELIGIBLE_BY_RECORD") && <div className="collection-warning factory-warning" role="status"><AlertTriangle size={18} aria-hidden="true" /><div><b>Some incoming sources are ineligible or unverified.</b><p>These batches are visible for review and cannot be selected. The backend checks source status again when processing is created.</p></div></div>}
    </section>

    <section className="collection-form-panel" id="create-processing">
      <div className="farmer-panel-heading"><div><p className="eyebrow">New processing record</p><h2>Create a Processing Batch</h2></div><span className="record-count">PBID assigned by server</span></div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="collection-form-grid"><FormField id="factory-product" name="product" label="Processed product" required maxLength={120} value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Enter product name" /><FormField id="factory-packs" name="packs" label="Pack count" type="number" min="1" step="1" required value={packs} onChange={(event) => setPacks(event.target.value)} placeholder="Enter whole number" /><FormField id="factory-date" name="date" label="Processing date and time" type="datetime-local" required value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <div className="collection-source-header"><div><h3>Select eligible incoming batches</h3><p>Only batches eligible by recorded withdrawal dates can be selected. Input volume is calculated by the backend from linked batches.</p></div><span className="record-count">{selected.length} selected · {selectedVolume.toLocaleString()} L</span></div>
        {eligibleBatches.length === 0 ? <EmptyState title="No eligible batches available" description="There are no unlinked incoming batches that the backend currently marks eligible by record." />
          : <div className="collection-source-list">{eligibleBatches.map((batch) => <label className="collection-source-option" key={batch.id}><input type="checkbox" checked={selected.includes(batch.batchId)} onChange={() => toggleBatch(batch)} aria-label={`Select milk batch ${batch.batchId}`} /><span className="collection-source-main"><b>{batch.batchId} · {batch.volumeL.toLocaleString()} L</b><span>{batch.collectionCentre ?? "Centre profile incomplete"} · {formatDateTime(batch.date)}</span>{!batch.collectionCentreProfileComplete && <small>Legacy / incomplete centre profile</small>}</span><StatusBadge tone="safe">Eligible by record</StatusBadge></label>)}</div>}
        {formError && <ErrorMessage message={formError} />}
        <div className="collection-form-actions"><p><ShieldCheck size={15} aria-hidden="true" /> Server validates source status and persists all MBID to PBID links.</p><Button type="submit" disabled={saving || selected.length === 0}>{saving ? "Saving processing batch…" : "Create processing batch"}</Button></div>
      </form>
    </section>

    {confirmedBatch && <section className="collection-saved-notice" role="status"><CheckCircle2 size={20} aria-hidden="true" /><div><b>Server confirmed Processing Batch {confirmedBatch.batchId}.</b><span> {confirmedBatch.volumeL.toLocaleString()} L linked from {confirmedBatch.sources.length} source batch{confirmedBatch.sources.length === 1 ? "" : "es"}.</span></div></section>}
    {error && <ErrorMessage message={`Dashboard refresh failed: ${error}`} />}

    <section className="farmer-panel factory-history-panel" id="processing-history">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Batch genealogy</p><h2>Processing history</h2></div><Button variant="secondary" onClick={reload}><RefreshCw size={15} aria-hidden="true" /> Refresh history</Button></div>
      <div className="farmer-table-controls"><label className="farmer-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search processing history</span><input type="search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search PBID, MBID, or product" /></label><label className="farmer-filter"><span>Processing status</span><select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)}><option value="ALL">All statuses</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option><option value="DISPATCHED">Dispatched</option><option value="HOLD">HOLD</option></select></label></div>
      {history.length === 0 ? <EmptyState title="No processing batches recorded" description="Processing batches confirmed by the backend will appear here with source Milk Batch IDs and recorded genealogy." />
        : filteredHistory.length === 0 ? <EmptyState title="No processing batches match" description="Try a different PBID, MBID, product, or status filter." />
          : <div className="factory-processing-list">{filteredHistory.map((batch) => <ProcessingCard key={batch.id} batch={batch} />)}</div>}
    </section>

    <ConfirmDialog open={confirmOpen} title="Create this processing batch?" onCancel={() => setConfirmOpen(false)} onConfirm={() => void saveBatch()} confirmLabel="Create processing batch"><p>This creates a server assigned PBID and stores links to the {selected.length} selected source Milk Batch IDs. The backend recalculates total quantity and checks source eligibility.</p><ul className="collection-dialog-sources">{selectedBatches.map((batch) => <li key={batch.id}>{batch.batchId} · {batch.volumeL.toLocaleString()} L</li>)}</ul></ConfirmDialog>
  </div>;
}
