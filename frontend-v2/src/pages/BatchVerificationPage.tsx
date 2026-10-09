import { useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2, CircleHelp, Clock3, Milk, ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorMessage, LoadingIndicator } from "../components/ui/Feedback";
import { FormField } from "../components/ui/FormField";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ApiError } from "../services/api/client";
import { verifyPublicMilkBatch } from "../services/api/publicVerification";
import type { PublicBatchVerification } from "../types/api";

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function batchTone(status: string): "safe" | "hold" | "neutral" {
  if (status === "SAFE" || status === "COMPLETED") return "safe";
  if (status === "HOLD") return "hold";
  return "neutral";
}

function TraceTimeline({ verification }: { verification: PublicBatchVerification["batch"] }) {
  const portalEvents = verification.timeline.filter((entry) => entry.direction === "portal");
  return <section className="verification-timeline-panel" aria-labelledby="verification-timeline-heading">
    <div className="verification-section-heading"><span><Clock3 size={17} aria-hidden="true" /></span><div><p className="eyebrow">Batch genealogy</p><h2 id="verification-timeline-heading">Traceability timeline</h2></div></div>
    <ol className="verification-timeline">
      {verification.timeline.map((entry, index) => <li className={`timeline-${entry.direction}`} key={`${entry.direction}-${entry.eventType}-${entry.batchId}-${entry.occurredAt}-${index}`}>
        <span className="verification-timeline-icon" aria-hidden="true">{entry.direction === "collection" ? <Milk size={15} /> : entry.direction === "forward" ? <ArrowUpRight size={15} /> : <CheckCircle2 size={14} />}</span>
        <div className="verification-timeline-content">
          <b>{entry.direction === "collection" ? "Collection record" : entry.direction === "forward" ? "Forward processing link" : entry.eventType.replaceAll("_", " ")}</b>
          <span>{entry.direction === "collection" ? `Milk Batch ${entry.batchId} collected` : entry.direction === "forward" ? `${verification.milkBatchId} → ${entry.batchId}` : `${entry.batchId} · portal event`}</span>
          <time dateTime={entry.occurredAt}>{formatDateTime(entry.occurredAt)}</time>
          {entry.direction === "forward" && <small><ArrowDownRight size={13} aria-hidden="true" /> Source batches (backward): {entry.sourceBatchIds?.length ? entry.sourceBatchIds.join(", ") : "No source links recorded"}</small>}
        </div>
      </li>)}
    </ol>
    {verification.processingBatches.length === 0 && portalEvents.length === 0 && <p className="verification-no-lineage"><CircleHelp size={16} aria-hidden="true" /> No processing link or separate traceability event is recorded for this Milk Batch ID.</p>}
  </section>;
}

export function BatchVerificationPage() {
  const [batchId, setBatchId] = useState("");
  const [result, setResult] = useState<PublicBatchVerification["batch"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "not-found" | "unavailable" | "error">("idle");

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedBatchId = batchId.trim();
    setResult(null);
    setError(null);
    setState("idle");
    if (!submittedBatchId) { setState("error"); setError("Enter a Milk Batch ID to verify."); return; }
    if (submittedBatchId.length > 100) { setState("error"); setError("Milk Batch ID must be 100 characters or fewer."); return; }
    setLoading(true);
    try {
      const response = await verifyPublicMilkBatch(submittedBatchId);
      setResult(response.batch);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Batch verification failed. Try again.";
      if (cause instanceof ApiError && cause.status === 404 && message === "Milk Batch ID was not found.") {
        setState("not-found");
        setError(message);
      } else if (cause instanceof ApiError && (cause.status === 0 || cause.status >= 500 || cause.status === 404)) {
        setState("unavailable");
        setError(cause.status === 404 ? "The verification service is not available on this backend." : "The verification service is temporarily unavailable. Try again later.");
      } else {
        setState("error");
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-page consumer-verification-page mx-auto max-w-4xl px-5 py-12">
    <p className="eyebrow"><ScanLine size={16} aria-hidden="true" /> Public traceability</p>
    <h1 className="auth-title">Consumer batch verification</h1>
    <p className="auth-intro">Look up a Milk Batch ID to view its recorded status, collection date, processing link, and available traceability records. No account is required.</p>

    <Card className="verification-lookup-card">
      <form className="verification-lookup-form" onSubmit={(event) => void handleVerify(event)} noValidate>
        <FormField id="verification-batch-id" name="batchId" label="Milk Batch ID" autoComplete="off" required value={batchId} onChange={(event) => { setBatchId(event.target.value); setError(null); setState("idle"); setResult(null); }} placeholder="Enter the Milk Batch ID from the label" hint="Enter the complete batch ID as printed." />
        <Button className="verification-submit" type="submit" disabled={loading}>{loading ? "Verifying…" : <><ScanLine size={17} aria-hidden="true" /> Verify batch</>}</Button>
      </form>
      {loading && <LoadingIndicator label="Looking up the Milk Batch ID" />}
      {!loading && error && <div className={`verification-feedback verification-${state}`} role={state === "error" || state === "unavailable" ? "alert" : "status"}>
        {state === "not-found" ? <CircleHelp size={20} aria-hidden="true" /> : state === "unavailable" ? <ShieldAlert size={20} aria-hidden="true" /> : <ErrorMessage message={error} />}
        {state !== "error" && <div><b>{state === "not-found" ? "Batch not found" : "Verification unavailable"}</b><p>{error}</p></div>}
      </div>}
    </Card>

    {result && <div className="verification-result" aria-live="polite">
      <section className="verification-result-card" aria-labelledby="verification-result-title">
        <div className="verification-result-heading"><div><p className="eyebrow">Milk batch record</p><h2 id="verification-result-title">{result.milkBatchId}</h2></div><StatusBadge tone={batchTone(result.status)}>{result.status}</StatusBadge></div>
        <dl className="verification-batch-facts"><div><dt><CalendarDays size={14} aria-hidden="true" /> Collection date</dt><dd>{formatDateTime(result.collectionDate)}</dd></div><div><dt><ShieldCheck size={14} aria-hidden="true" /> Recorded status</dt><dd>{result.status}</dd></div></dl>
        <div className="verification-processing-links"><h3>Linked Processing Batch IDs</h3>{result.processingBatches.length === 0 ? <p>No linked Processing Batch ID is recorded.</p> : <ul>{result.processingBatches.map((processing) => <li key={processing.batchId}><b>{processing.batchId}</b><span>{formatDateTime(processing.date)} · {processing.status}</span><small>Source batches: {processing.sourceBatchIds.length ? processing.sourceBatchIds.join(", ") : "No source links recorded"}</small></li>)}</ul>}</div>
      </section>
      <TraceTimeline verification={result} />
      <aside className="verification-disclaimer"><ShieldAlert size={17} aria-hidden="true" /><div><b>What this result means</b><ul>{result.notices.map((notice) => <li key={notice}>{notice}</li>)}</ul></div></aside>
    </div>}
  </div>;
}
