import { ArrowLeft, CalendarDays, CircleHelp, Milk, ShieldAlert, Stethoscope } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/Feedback";
import { StatusBadge } from "../components/ui/StatusBadge";
import { milkEligibilityForCattle } from "../features/farmer/milkEligibility";
import { useFarmerDashboard } from "../layouts/useFarmerDashboard";
import type { FarmerCattle, MilkEligibility } from "../types/api";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function eligibilityTone(value: MilkEligibility): "hold" | "safe" | "neutral" {
  if (value === "HOLD") return "hold";
  return value === "ELIGIBLE_BY_RECORD" ? "safe" : "neutral";
}

function eligibilityText(value: MilkEligibility): string {
  if (value === "HOLD") return "Withdrawal hold";
  if (value === "UNVERIFIED") return "Review required";
  return "No active withdrawal recorded";
}

function activeWithdrawalEnd(cattle: FarmerCattle): string | null {
  const futureEnds = cattle.treatments
    .map((treatment) => treatment.withdrawalEnds)
    .filter((date): date is string => date !== null && Date.parse(date) > Date.now());
  if (futureEnds.length === 0) return null;
  return futureEnds.reduce((latest, current) => Date.parse(current) > Date.parse(latest) ? current : latest);
}

export function FarmerCattleDetailPage() {
  const { cattleId } = useParams();
  const { data } = useFarmerDashboard();
  if (!data) return <EmptyState title="Cattle records unavailable" description="Return to the dashboard and refresh your farm records." />;
  const cattle = data.cattle.find((animal) => animal.cattleId === cattleId);
  if (!cattle) return <EmptyState title="Cattle record not found" description="This animal is not included in your farmer profile." />;

  const eligibility = milkEligibilityForCattle(cattle);
  const withdrawalEnd = activeWithdrawalEnd(cattle);
  const milkBatches = data.milkBatches.filter((batch) => batch.contributingAnimals.some((entry) => entry.cattle.id === cattle.id));

  return <div className="farmer-detail-page">
    <Link className="back-to-dashboard" to="/dashboard/farmer"><ArrowLeft size={16} aria-hidden="true" /> Back to farmer overview</Link>
    <section className="farmer-detail-heading"><div><p className="eyebrow">Cattle record</p><h1>{cattle.name || cattle.cattleId}</h1><p>{cattle.cattleId}{cattle.breed ? ` · ${cattle.breed}` : ""}{cattle.sex ? ` · ${cattle.sex.toLowerCase()}` : ""}</p></div><span className="farmer-detail-icon"><Stethoscope size={24} aria-hidden="true" /></span></section>

    <div className="cattle-detail-grid">
      <Card className="eligibility-card"><div className="detail-section-title"><Milk size={19} aria-hidden="true" /><h2>Milk eligibility</h2></div>
        <StatusBadge tone={eligibilityTone(eligibility)}>{eligibilityText(eligibility)}</StatusBadge>
        {withdrawalEnd ? <p className="eligibility-detail">Recorded withdrawal period ends {formatDate(withdrawalEnd)}.</p>
          : eligibility === "UNVERIFIED" ? <p className="eligibility-detail">A treatment is missing its withdrawal end date. Confirm the record before making milk handling decisions.</p>
            : <p className="eligibility-detail">Based on recorded treatment withdrawal dates only. This is not a laboratory residue result or certification.</p>}
      </Card>

      <Card className="cattle-facts-card"><div className="detail-section-title"><CalendarDays size={19} aria-hidden="true" /><h2>Animal details</h2></div><dl className="cattle-facts">
        <div><dt>Breed</dt><dd>{cattle.breed || "Not recorded"}</dd></div><div><dt>Sex</dt><dd>{cattle.sex || "Not recorded"}</dd></div><div><dt>Date of birth</dt><dd>{cattle.dateOfBirth ? formatDate(cattle.dateOfBirth) : "Not recorded"}</dd></div><div><dt>Added to records</dt><dd>{formatDate(cattle.createdAt)}</dd></div>
      </dl></Card>
    </div>

    {withdrawalEnd && <section className="detail-alert" role="status"><ShieldAlert size={18} aria-hidden="true" /><p><b>Withdrawal hold:</b> the latest recorded active withdrawal period ends {formatDate(withdrawalEnd)}.</p></section>}
    {eligibility === "UNVERIFIED" && <section className="detail-alert alert-warning" role="status"><CircleHelp size={18} aria-hidden="true" /><p><b>Withdrawal details need review:</b> at least one treatment has no recorded withdrawal end date.</p></section>}

    <section className="farmer-panel detail-treatments"><div className="farmer-panel-heading"><div><p className="eyebrow">Animal health</p><h2>Treatment history</h2></div><span className="record-count">{cattle.treatments.length} recorded</span></div>
      {cattle.treatments.length === 0 ? <EmptyState title="No treatment history" description="Treatment records for this animal will appear here when recorded by an authorized veterinarian." />
        : <div className="farmer-table-scroll"><table className="farmer-table"><thead><tr><th scope="col">Medicine</th><th scope="col">Dosage</th><th scope="col">Reason</th><th scope="col">Administered</th><th scope="col">Withdrawal ends</th></tr></thead><tbody>
          {cattle.treatments.map((treatment) => <tr key={treatment.id}><th scope="row"><span className="animal-name">{treatment.medicineName}</span></th><td>{treatment.dosage || "Not recorded"}</td><td>{treatment.reason || "Not recorded"}</td><td>{formatDate(treatment.administeredAt)}</td><td>{treatment.withdrawalEnds ? formatDate(treatment.withdrawalEnds) : <StatusBadge>Not recorded</StatusBadge>}</td></tr>)}
        </tbody></table></div>}
    </section>

    <section className="farmer-panel"><div className="farmer-panel-heading"><div><p className="eyebrow">Supply-chain records</p><h2>Linked milk batches</h2></div><span className="record-count">{milkBatches.length} linked</span></div>
      {milkBatches.length === 0 ? <EmptyState title="No linked milk batches" description="A batch will appear when this animal is recorded as a contributing animal." />
        : <div className="farmer-table-scroll"><table className="farmer-table"><thead><tr><th scope="col">Batch ID</th><th scope="col">Collection date</th><th scope="col">Volume</th><th scope="col">Status</th></tr></thead><tbody>
          {milkBatches.map((batch) => <tr key={batch.id}><th scope="row"><span className="animal-name">{batch.batchId}</span></th><td>{formatDate(batch.date)}</td><td>{batch.volumeL.toLocaleString()} L</td><td><StatusBadge tone={batch.status === "SAFE" ? "safe" : batch.status === "HOLD" ? "hold" : "neutral"}>{batch.status}</StatusBadge></td></tr>)}
        </tbody></table></div>}
    </section>
  </div>;
}
