import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Download, FileText, Milk, RefreshCw, Search, ShieldAlert, ShieldCheck, Users, Syringe } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { AuthorityOutletContext } from "../layouts/AuthorityDashboardLayout";
import type { AuthorityCattleRecord, AuthorityMilkBatchRecord, AuthorityProcessingBatchRecord, AuthorityTraceabilityEvent, AuthorityTreatmentRecord, AuthorityUserRecord } from "../types/api";

function dateTime(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function tone(status: string): "safe" | "hold" | "neutral" | "danger" {
  if (status === "SAFE" || status === "ELIGIBLE_BY_RECORD" || status === "COMPLETED") return "safe";
  if (status === "HOLD") return "hold";
  if (status === "UNVERIFIED") return "danger";
  return "neutral";
}

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Metric({ title, value, caption, icon: Icon, tone: color = "forest" }: { title: string; value: number; caption: string; icon: typeof Users; tone?: "forest" | "blue" | "brown" }) {
  return <article className={`farmer-metric tone-${color}`}><div className="farmer-metric-top"><span>{title}</span><Icon size={19} aria-hidden="true" /></div><p className="farmer-metric-value">{value.toLocaleString()}</p><p className="farmer-metric-caption">{caption}</p></article>;
}

function DataChart({ title, data, caption }: { title: string; data: Array<{ label: string; value: number; color?: "forest" | "blue" | "brown" }>; caption: string }) {
  const maximum = Math.max(1, ...data.map((item) => item.value));
  return <section className="authority-chart" aria-label={`${title}. ${caption}`}><div className="authority-chart-head"><h3>{title}</h3><span>{caption}</span></div><ul>{data.map((item) => <li key={item.label}><span>{item.label}</span><div className="authority-chart-track" aria-hidden="true"><i className={`chart-${item.color ?? "forest"}`} style={{ width: `${Math.max(item.value > 0 ? 3 : 0, item.value / maximum * 100)}%` }} /></div><b>{item.value.toLocaleString()}</b></li>)}</ul></section>;
}

function SearchBox({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="farmer-search authority-search" htmlFor={id}><Search size={16} aria-hidden="true" /><span className="sr-only">{label}</span><input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function RoleSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="farmer-filter"><span>Role</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="ALL">All roles</option>{["FARMER", "VETERINARIAN", "COLLECTION_CENTRE", "FACTORY", "AUTHORITY", "CONSUMER"].map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>;
}

function roleCsv(users: AuthorityUserRecord[]) {
  downloadCsv("residuguard-users.csv", ["Name", "Email", "Role", "Organization", "Created"], users.map((user) => [user.name, user.email, user.role, user.organization, user.createdAt]));
}

function milkCsv(batches: AuthorityMilkBatchRecord[]) {
  downloadCsv("residuguard-milk-batches.csv", ["MBID", "Date", "Volume L", "Recorded status", "Withdrawal eligibility", "Collection centre", "Source cattle", "Linked PBIDs"], batches.map((batch) => [batch.batchId, batch.date, batch.volumeL, batch.status, batch.eligibility, batch.collectionCentre ?? "Legacy / incomplete profile", batch.sources.map((source) => source.cattleId).join("; "), batch.processingBatchIds.join("; ")]));
}

function processingCsv(batches: AuthorityProcessingBatchRecord[]) {
  downloadCsv("residuguard-processing-batches.csv", ["PBID", "Date", "Volume L", "Product", "Packs", "Status", "Factory", "Source MBIDs"], batches.map((batch) => [batch.batchId, batch.date, batch.volumeL, batch.product, batch.packs, batch.status, batch.factoryName ?? "Legacy / incomplete profile", batch.sourceMilkBatchIds.join("; ")]));
}

function eventCsv(events: AuthorityTraceabilityEvent[]) {
  downloadCsv("residuguard-traceability-events.csv", ["Event", "Entity type", "Entity ID", "Created", "Recorded transaction reference", "Recorded block number", "Recorded status", "Payload"], events.map((event) => [event.eventType, event.entityType, event.entityId, event.createdAt, event.blockchainTxId, event.blockNumber, event.blockchainStatus, JSON.stringify(event.payload)]));
}

function UserTable({ users }: { users: AuthorityUserRecord[] }) {
  return users.length === 0 ? <EmptyState title="No users match" description="Try another name, email, or role filter." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Registered ResiduGuard users and their current roles</caption><thead><tr><th scope="col">User</th><th scope="col">Email</th><th scope="col">Organization</th><th scope="col">Role</th><th scope="col">Created</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="animal-name">{user.name}</span><span className="animal-id">{user.id}</span></td><td>{user.email}</td><td>{user.organization || "Not recorded"}</td><td><StatusBadge>{user.role.replaceAll("_", " ")}</StatusBadge></td><td>{dateTime(user.createdAt)}</td></tr>)}</tbody></table></div>;
}

function TreatmentTable({ treatments }: { treatments: AuthorityTreatmentRecord[] }) {
  return treatments.length === 0 ? <EmptyState title="No treatments match" description="Try another treatment, cattle, farmer, or veterinarian search." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Recorded veterinary treatments and withdrawal dates</caption><thead><tr><th scope="col">Cattle / farmer</th><th scope="col">Treatment</th><th scope="col">Veterinarian</th><th scope="col">Administered</th><th scope="col">Withdrawal ends</th><th scope="col">Record note</th></tr></thead><tbody>{treatments.map((item) => <tr key={item.id}><td><b>{item.cattle.name || item.cattle.cattleId}</b><small className="authority-cell-sub">{item.cattle.cattleId} · {item.cattle.farmer.user.name}</small></td><td>{item.medicineName}<small className="authority-cell-sub">{item.dosage || "Dosage not recorded"}</small></td><td>{item.veterinarian.name ?? "Legacy / incomplete veterinarian profile"}{item.veterinarian.profileCompleteness !== "COMPLETE" && <small className="authority-cell-sub">Not linked to a complete account</small>}</td><td>{dateTime(item.administeredAt)}</td><td>{dateTime(item.withdrawalEnds)}</td><td>{item.reason || "Not recorded"}</td></tr>)}</tbody></table></div>;
}

function CattleTable({ cattle }: { cattle: AuthorityCattleRecord[] }) {
  return cattle.length === 0 ? <EmptyState title="No cattle match" description="Try another Cow ID, farmer, or withdrawal status filter." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Cattle and current withdrawal record status</caption><thead><tr><th scope="col">Cattle</th><th scope="col">Farmer</th><th scope="col">Village</th><th scope="col">Latest treatment</th><th scope="col">Withdrawal status</th></tr></thead><tbody>{cattle.map((animal) => <tr key={animal.id}><td><b>{animal.name || animal.cattleId}</b><small className="authority-cell-sub">{animal.cattleId} · {animal.breed || "Breed not recorded"}</small></td><td>{animal.farmer.user.name}</td><td>{animal.farmer.village}</td><td>{animal.treatments[0] ? `${animal.treatments[0].medicineName} · ${dateTime(animal.treatments[0].administeredAt)}` : "No treatment recorded"}</td><td><StatusBadge tone={tone(animal.withdrawalStatus)}>{animal.withdrawalStatus.replaceAll("_", " ")}</StatusBadge></td></tr>)}</tbody></table></div>;
}

function MilkTable({ batches }: { batches: AuthorityMilkBatchRecord[] }) {
  return batches.length === 0 ? <EmptyState title="No milk batches match" description="Try a different MBID, collection centre, or status." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Milk batch statuses and source lineage</caption><thead><tr><th scope="col">MBID</th><th scope="col">Collected</th><th scope="col">Quantity</th><th scope="col">Recorded status</th><th scope="col">Withdrawal eligibility</th><th scope="col">Centre / source cattle</th><th scope="col">Processing links</th></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id}><td><b>{batch.batchId}</b></td><td>{dateTime(batch.date)}</td><td>{batch.volumeL.toLocaleString()} L</td><td><StatusBadge tone={tone(batch.status)}>{batch.status}</StatusBadge></td><td><StatusBadge tone={tone(batch.eligibility)}>{batch.eligibility.replaceAll("_", " ")}</StatusBadge></td><td>{batch.collectionCentre ?? "Legacy / incomplete centre profile"}{batch.collectionCentreProfileCompleteness !== "COMPLETE" && <small className="authority-cell-sub">Not linked to a complete account</small>}<small className="authority-cell-sub">{batch.sources.map((source) => source.cattleId).join(", ") || "No cattle links"}</small></td><td>{batch.processingBatchIds.join(", ") || "Not linked"}</td></tr>)}</tbody></table></div>;
}

function ProcessingTable({ batches }: { batches: AuthorityProcessingBatchRecord[] }) {
  return batches.length === 0 ? <EmptyState title="No processing batches match" description="Try another PBID, factory, source MBID, or status." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Processing batches and source milk batch genealogy</caption><thead><tr><th scope="col">PBID</th><th scope="col">Date</th><th scope="col">Quantity</th><th scope="col">Product / packs</th><th scope="col">Factory</th><th scope="col">Status</th><th scope="col">Source MBIDs</th></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id}><td><b>{batch.batchId}</b></td><td>{dateTime(batch.date)}</td><td>{batch.volumeL.toLocaleString()} L</td><td>{batch.product} · {batch.packs} packs</td><td>{batch.factoryName ?? "Legacy / incomplete factory profile"}{batch.factoryProfileCompleteness !== "COMPLETE" && <small className="authority-cell-sub">Not linked to a complete account</small>}</td><td><StatusBadge tone={tone(batch.status)}>{batch.status}</StatusBadge></td><td>{batch.sourceMilkBatchIds.join(", ") || "No source links"}</td></tr>)}</tbody></table></div>;
}

function EventTable({ events }: { events: AuthorityTraceabilityEvent[] }) {
  return events.length === 0 ? <EmptyState title="No traceability events recorded" description="Portal events will be shown here when present in the backend." /> : <div className="farmer-table-scroll"><table className="farmer-table authority-table"><caption className="sr-only">Portal traceability events and stored blockchain metadata</caption><thead><tr><th scope="col">Event</th><th scope="col">Entity</th><th scope="col">Recorded</th><th scope="col">Stored blockchain metadata</th><th scope="col">Payload</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.eventType.replaceAll("_", " ")}</td><td>{event.entityType}<small className="authority-cell-sub">{event.entityId}</small></td><td>{dateTime(event.createdAt)}</td><td>{event.blockchainTxId || event.blockNumber || event.blockchainStatus ? <><span>Tx ref: {event.blockchainTxId || "—"}</span><small className="authority-cell-sub">Block: {event.blockNumber || "—"} · Status: {event.blockchainStatus || "—"} · Not independently verified</small></> : "No blockchain metadata recorded"}</td><td><code className="authority-payload">{JSON.stringify(event.payload)}</code></td></tr>)}</tbody></table></div>;
}

function countStatus(rows: Array<{ status: string }>, status: string) { return rows.filter((row) => row.status === status).length; }

export function AuthorityDashboardPage() {
  const { data, error, reload } = useOutletContext<AuthorityOutletContext>();
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [cattleSearch, setCattleSearch] = useState("");
  const [cattleFilter, setCattleFilter] = useState("ALL");
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [milkSearch, setMilkSearch] = useState("");
  const [milkFilter, setMilkFilter] = useState("ALL");
  const [processingSearch, setProcessingSearch] = useState("");
  const [processingFilter, setProcessingFilter] = useState("ALL");
  const [eventSearch, setEventSearch] = useState("");

  const users = useMemo(() => (data?.users ?? []).filter((user) => (roleFilter === "ALL" || user.role === roleFilter) && [user.name, user.email, user.organization ?? "", user.role].some((value) => value.toLowerCase().includes(userSearch.trim().toLowerCase()))), [data?.users, roleFilter, userSearch]);
  const cattle = useMemo(() => (data?.cattle ?? []).filter((animal) => (cattleFilter === "ALL" || animal.withdrawalStatus === cattleFilter) && [animal.cattleId, animal.name ?? "", animal.farmer.user.name, animal.farmer.village].some((value) => value.toLowerCase().includes(cattleSearch.trim().toLowerCase()))), [data?.cattle, cattleFilter, cattleSearch]);
  const treatments = useMemo(() => (data?.treatments ?? []).filter((item) => [item.medicineName, item.cattle.cattleId, item.cattle.name ?? "", item.cattle.farmer.user.name, item.veterinarian.name ?? ""].some((value) => value.toLowerCase().includes(treatmentSearch.trim().toLowerCase()))), [data?.treatments, treatmentSearch]);
  const milkBatches = useMemo(() => (data?.milkBatches ?? []).filter((batch) => (milkFilter === "ALL" || (milkFilter === "HOLD" ? batch.status === "HOLD" || batch.eligibility === "HOLD" : batch.status === milkFilter)) && [batch.batchId, batch.collectionCentre ?? "", ...batch.sources.map((source) => source.cattleId)].some((value) => value.toLowerCase().includes(milkSearch.trim().toLowerCase()))), [data?.milkBatches, milkFilter, milkSearch]);
  const processingBatches = useMemo(() => (data?.processingBatches ?? []).filter((batch) => (processingFilter === "ALL" || batch.status === processingFilter) && [batch.batchId, batch.product, batch.factoryName ?? "", ...batch.sourceMilkBatchIds].some((value) => value.toLowerCase().includes(processingSearch.trim().toLowerCase()))), [data?.processingBatches, processingFilter, processingSearch]);
  const events = useMemo(() => (data?.traceabilityEvents ?? []).filter((event) => [event.eventType, event.entityType, event.entityId, event.blockchainTxId ?? "", event.blockNumber ?? ""].some((value) => value.toLowerCase().includes(eventSearch.trim().toLowerCase()))), [data?.traceabilityEvents, eventSearch]);

  if (!data) return <EmptyState title="Authority records unavailable" description={error ?? "The backend did not return authorized dashboard data."} />;
  const roleData = Object.entries(data.roleCounts).map(([role, value]) => ({ label: role.replaceAll("_", " "), value: value ?? 0, color: role === "AUTHORITY" ? "brown" as const : "forest" as const }));
  const milkStatuses = ["SAFE", "HOLD", "PROCESSING", "DISPATCHED"].map((status) => ({ label: status, value: countStatus(data.milkBatches, status), color: status === "HOLD" ? "brown" as const : "blue" as const }));
  const processingStatuses = ["PROCESSING", "COMPLETED", "DISPATCHED", "HOLD"].map((status) => ({ label: status, value: countStatus(data.processingBatches, status), color: status === "HOLD" ? "brown" as const : "forest" as const }));
  const recordCaption = `Latest up to ${data.dataAvailability.recordLimit} records returned`;

  return <div className="authority-dashboard">
    <section className="farmer-welcome"><div><p className="eyebrow">Authorized oversight</p><h1>Authority dashboard</h1><p>Monitor stored users, treatment records, withdrawal eligibility, batch status, and traceability events.</p></div><span className="farmer-welcome-icon"><ShieldCheck size={25} aria-hidden="true" /></span></section>

    <section className="farmer-metrics-grid authority-metrics" aria-label="Administrative summary metrics">
      <Metric title="Registered users" value={data.summary.users} caption="All user accounts in the backend" icon={Users} />
      <Metric title="Cattle records" value={data.summary.cattle} caption="All recorded cattle" icon={Activity} tone="blue" />
      <Metric title="Treatment records" value={data.summary.treatments} caption="All recorded treatments" icon={Syringe} />
      <Metric title="Active withdrawal holds" value={data.summary.activeWithdrawalHolds} caption="Distinct cattle with end date in the future" icon={ShieldAlert} tone="brown" />
      <Metric title="Milk batches on HOLD" value={data.summary.holdMilkBatches} caption="Stored HOLD status" icon={Milk} tone="brown" />
      <Metric title="Processing batches" value={data.summary.processingBatches} caption="All recorded processing batches" icon={FileText} tone="blue" />
    </section>
    <div className="authority-data-note" role="note"><AlertTriangle size={17} aria-hidden="true" /><p>Withdrawal indicators are derived from treatment records, not laboratory testing. Counts above are database totals; tables and charts below show at most the latest {data.dataAvailability.recordLimit} records per category.</p><Button variant="secondary" onClick={reload}><RefreshCw size={14} aria-hidden="true" /> Refresh data</Button></div>

    <section className="authority-chart-grid" aria-label="Record summary charts">
      <DataChart title="Users by role" data={roleData} caption="Full role counts" />
      <DataChart title="Milk batch status" data={milkStatuses} caption={recordCaption} />
      <DataChart title="Processing batch status" data={processingStatuses} caption={recordCaption} />
    </section>

    <section className="farmer-panel authority-section" id="users-roles">
      <div className="farmer-panel-heading"><div><p className="eyebrow">User directory</p><h2>Users and roles</h2></div><Button variant="secondary" onClick={() => roleCsv(data.users)}><Download size={15} aria-hidden="true" /> Export users CSV</Button></div>
      <div className="authority-data-note authority-inline-note"><ShieldCheck size={16} aria-hidden="true" /><p>Role assignments are displayed from backend records. Role changes and account suspension are unavailable because no administrative mutation API or approval model exists.</p></div>
      <div className="farmer-table-controls"><SearchBox id="authority-users-search" label="Search users" value={userSearch} onChange={setUserSearch} placeholder="Search name, email, or organization" /><RoleSelect value={roleFilter} onChange={setRoleFilter} /></div>
      <UserTable users={users} />
      <p className="authority-record-count">Showing {users.length} of {data.users.length} returned users ({data.summary.users} total accounts).</p>
    </section>

    <section className="farmer-panel authority-section" id="compliance">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Veterinary records</p><h2>Cattle and withdrawal monitoring</h2></div></div>
      <div className="authority-filter-row"><SearchBox id="authority-cattle-search" label="Search cattle and farmers" value={cattleSearch} onChange={setCattleSearch} placeholder="Search Cow ID, farmer, village" /><label className="farmer-filter"><span>Withdrawal status</span><select value={cattleFilter} onChange={(event) => setCattleFilter(event.target.value)}><option value="ALL">All statuses</option><option value="ELIGIBLE_BY_RECORD">Eligible by record</option><option value="HOLD">Active hold</option><option value="UNVERIFIED">Unverified</option></select></label></div>
      <CattleTable cattle={cattle} />
      <div className="farmer-panel-heading authority-subheading"><div><p className="eyebrow">Treatment history</p><h2>Recorded treatments</h2></div></div>
      <div className="farmer-table-controls"><SearchBox id="authority-treatment-search" label="Search treatments" value={treatmentSearch} onChange={setTreatmentSearch} placeholder="Search medicine, Cow ID, farmer, veterinarian" /></div>
      <TreatmentTable treatments={treatments} />
      <div className="authority-unavailable" role="status"><AlertTriangle size={18} aria-hidden="true" /><div><b>MRL reference records unavailable</b><p>{data.dataAvailability.mrlReferences.reason} No MRL threshold is inferred from withdrawal dates or treatment records.</p></div></div>
    </section>

    <section className="farmer-panel authority-section" aria-labelledby="authority-holds-title">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Review queue</p><h2 id="authority-holds-title">HOLD records</h2></div><StatusBadge tone="hold">{data.holds.cattle.length + data.holds.milkBatches.length + data.holds.processingBatches.length} records</StatusBadge></div>
      <div className="authority-data-note authority-inline-note"><AlertTriangle size={16} aria-hidden="true" /><p>{data.dataAvailability.holdInvestigations.reason} These rows are not investigation cases.</p></div>
      <div className="authority-hold-grid"><article><h3>Cattle with withdrawal hold / unverified</h3>{data.holds.cattle.length ? <ul>{data.holds.cattle.map((row) => <li key={row.cattleId}><b>{row.name || row.cattleId}</b><span>{row.cattleId} · {row.farmerName}</span><StatusBadge tone={tone(row.status)}>{row.status.replaceAll("_", " ")}</StatusBadge></li>)}</ul> : <p className="authority-empty-text">No current hold or unverified cattle in returned records.</p>}</article><article><h3>Milk batches with HOLD status</h3>{data.holds.milkBatches.length ? <ul>{data.holds.milkBatches.map((row) => <li key={row.id}><b>{row.batchId}</b><span>{row.volumeL.toLocaleString()} L · {row.collectionCentre ?? "Legacy / incomplete centre profile"}</span><StatusBadge tone="hold">{row.status}</StatusBadge></li>)}</ul> : <p className="authority-empty-text">No HOLD milk batches in returned records.</p>}</article><article><h3>Processing batches with HOLD status</h3>{data.holds.processingBatches.length ? <ul>{data.holds.processingBatches.map((row) => <li key={row.id}><b>{row.batchId}</b><span>{row.volumeL.toLocaleString()} L · {row.factoryName ?? "Legacy / incomplete factory profile"}</span><StatusBadge tone="hold">{row.status}</StatusBadge></li>)}</ul> : <p className="authority-empty-text">No HOLD processing batches in returned records.</p>}</article></div>
    </section>

    <section className="farmer-panel authority-section" id="batches">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Supply chain records</p><h2>Milk and processing batches</h2></div><div className="authority-export-group"><Button variant="secondary" onClick={() => milkCsv(data.milkBatches)}><Download size={14} aria-hidden="true" /> Milk CSV</Button><Button variant="secondary" onClick={() => processingCsv(data.processingBatches)}><Download size={14} aria-hidden="true" /> Processing CSV</Button></div></div>
      <div className="authority-filter-row"><SearchBox id="authority-milk-search" label="Search milk batches" value={milkSearch} onChange={setMilkSearch} placeholder="Search MBID, centre, or Cow ID" /><label className="farmer-filter"><span>Milk status</span><select value={milkFilter} onChange={(event) => setMilkFilter(event.target.value)}><option value="ALL">All statuses</option><option value="SAFE">SAFE</option><option value="HOLD">HOLD / ineligible</option><option value="PROCESSING">PROCESSING</option><option value="DISPATCHED">DISPATCHED</option></select></label></div>
      <MilkTable batches={milkBatches} />
      <div className="farmer-panel-heading authority-subheading"><div><p className="eyebrow">Processing genealogy</p><h2>Processing batches</h2></div></div>
      <div className="authority-filter-row"><SearchBox id="authority-processing-search" label="Search processing batches" value={processingSearch} onChange={setProcessingSearch} placeholder="Search PBID, product, factory, source MBID" /><label className="farmer-filter"><span>Processing status</span><select value={processingFilter} onChange={(event) => setProcessingFilter(event.target.value)}><option value="ALL">All statuses</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option><option value="DISPATCHED">Dispatched</option><option value="HOLD">HOLD</option></select></label></div>
      <ProcessingTable batches={processingBatches} />
    </section>

    <section className="farmer-panel authority-section" id="traceability">
      <div className="farmer-panel-heading"><div><p className="eyebrow">Portal audit</p><h2>Traceability events and blockchain metadata</h2></div><Button variant="secondary" onClick={() => eventCsv(data.traceabilityEvents)}><Download size={15} aria-hidden="true" /> Export events CSV</Button></div>
      <div className="authority-data-note authority-inline-note"><Activity size={16} aria-hidden="true" /><p>{data.dataAvailability.blockchainVerification.reason} Any transaction, block, or status below is shown only as stored metadata.</p></div>
      <div className="farmer-table-controls"><SearchBox id="authority-events-search" label="Search traceability events" value={eventSearch} onChange={setEventSearch} placeholder="Search event, entity, or recorded transaction reference" /></div>
      <EventTable events={events} />
      <p className="authority-record-count">Showing up to {data.dataAvailability.recordsReturned.traceabilityEvents} recent events of {data.dataAvailability.recordLimit} returned.</p>
    </section>

    <section className="authority-report-panel" aria-labelledby="reports-title"><div><p className="eyebrow">Reports</p><h2 id="reports-title">Export current backend records</h2><p>Download the currently returned records for review. Each file includes stored values only.</p></div><div className="authority-export-group"><Button variant="secondary" onClick={() => roleCsv(data.users)}><Download size={14} aria-hidden="true" /> Users</Button><Button variant="secondary" onClick={() => milkCsv(data.milkBatches)}><Download size={14} aria-hidden="true" /> Milk batches</Button><Button variant="secondary" onClick={() => processingCsv(data.processingBatches)}><Download size={14} aria-hidden="true" /> Processing</Button><Button variant="secondary" onClick={() => eventCsv(data.traceabilityEvents)}><Download size={14} aria-hidden="true" /> Events</Button></div></section>
    {error && <ErrorMessage message={`Refresh failed: ${error}`} />}
  </div>;
}
