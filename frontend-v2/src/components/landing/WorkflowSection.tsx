import { ArrowRight, Beef, Factory, Milk, ScanLine, ShieldCheck, Syringe, TimerReset, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const workflow: Array<{ label: string; icon: LucideIcon; tone: "green" | "blue" | "brown" }> = [
  { label: "Cattle health", icon: Beef, tone: "green" },
  { label: "Antibiotic treatment", icon: Syringe, tone: "brown" },
  { label: "Withdrawal monitoring", icon: TimerReset, tone: "blue" },
  { label: "SAFE / HOLD", icon: ShieldCheck, tone: "green" },
  { label: "Milk batch", icon: Milk, tone: "blue" },
  { label: "Processing batch", icon: Factory, tone: "brown" },
  { label: "Traceability", icon: Truck, tone: "green" },
  { label: "Consumer verification", icon: ScanLine, tone: "blue" },
];

export function WorkflowSection() {
  return <section id="workflow" className="workflow-section section-pad">
    <div className="section-container">
      <div className="section-heading centered-heading"><p className="eyebrow">One connected chain</p><h2>Every record has a next step.</h2><p>Follow the information as it moves from animal care through milk processing to the person choosing a product.</p></div>
      <ol className="workflow-list" aria-label="Dairy traceability workflow">
        {workflow.map(({ label, icon: Icon, tone }, index) => <li className="workflow-item" key={label}>
          <div className={`workflow-node tone-${tone}`}><span className="workflow-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span><span className="workflow-index">{String(index + 1).padStart(2, "0")}</span></div>
          <span className="workflow-label">{label}</span>
          {index < workflow.length - 1 && <ArrowRight className="workflow-arrow" size={16} aria-hidden="true" />}
        </li>)}
      </ol>
    </div>
  </section>;
}
