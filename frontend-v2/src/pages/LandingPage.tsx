import { ArrowDown, ArrowRight, Beef, Building2, Check, Factory, Leaf, Milk, ScanLine, ShieldCheck, Stethoscope, Syringe, Tractor } from "lucide-react";
import { Link } from "react-router-dom";
import { FeatureCard } from "../components/landing/FeatureCard";
import { ParticipantCard } from "../components/landing/ParticipantCard";
import { WorkflowSection } from "../components/landing/WorkflowSection";

export function LandingPage() {
  return <>
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Dairy health & supply-chain records</p>
          <h1>ResiduGuard</h1>
          <p className="hero-subtitle">From Cattle Treatment to Trusted Milk Traceability.</p>
          <p className="hero-description">Track cattle health, antibiotic treatment, withdrawal compliance and milk batches across the dairy supply chain.</p>
          <div className="hero-actions">
            <Link to="/sign-in" className="button button-primary button-large">Login to your workspace <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link to="/verify" className="button button-outline button-large"><ScanLine size={17} aria-hidden="true" /> Consumer verification</Link>
          </div>
          <a className="hero-scroll" href="#workflow"><span>Explore the record journey</span><ArrowDown size={15} aria-hidden="true" /></a>
        </div>
        <div className="hero-visual" aria-label="Illustration of connected cattle health, treatment, and milk batch records" role="img">
          <div className="visual-wash" />
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-label"><span className="visual-label-dot" /> A connected dairy record</div>
          <div className="visual-main-icon"><Beef size={60} strokeWidth={1.2} aria-hidden="true" /><span className="visual-leaf"><Leaf size={19} aria-hidden="true" /></span></div>
          <div className="visual-record record-health"><span className="visual-record-icon green-icon"><Beef size={18} aria-hidden="true" /></span><span><b>Animal health</b><small>Care records</small></span><Check className="record-check" size={16} aria-hidden="true" /></div>
          <div className="visual-record record-treatment"><span className="visual-record-icon brown-icon"><Syringe size={18} aria-hidden="true" /></span><span><b>Treatment history</b><small>Withdrawal tracking</small></span></div>
          <div className="visual-record record-milk"><span className="visual-record-icon blue-icon"><Milk size={18} aria-hidden="true" /></span><span><b>Milk batch</b><small>Supply-chain record</small></span></div>
          <span className="visual-connect connect-one" aria-hidden="true" /><span className="visual-connect connect-two" aria-hidden="true" />
          <div className="visual-footnote"><ShieldCheck size={16} aria-hidden="true" /><span>Records stay connected along the journey</span></div>
        </div>
      </div>
      <div className="hero-bottom-rule"><span /> <span /> <span /></div>
    </section>

    <WorkflowSection />

    <section id="features" className="features-section section-pad">
      <div className="section-container">
        <div className="section-heading"><p className="eyebrow">The platform</p><h2>Practical records.<br /><span>Greater confidence.</span></h2><p>Bring the details that support responsible dairy production into a consistent, traceable record.</p></div>
        <div className="feature-grid">
          <FeatureCard icon={Syringe} number="01" title="Antibiotic & Withdrawal Tracking" description="Record treatment details and withdrawal periods so teams can make informed milk handling decisions." />
          <FeatureCard icon={Milk} number="02" title="Milk Batch Traceability" description="Connect contributing animal and collection information with processing batch records throughout the supply chain." />
          <FeatureCard icon={ShieldCheck} number="03" title="Blockchain-Based Record Integrity" description="The platform is designed to support consistent, auditable records across participating supply-chain roles." />
        </div>
      </div>
    </section>

    <section id="participants" className="participants-section section-pad">
      <div className="section-container">
        <div className="participants-heading"><div className="section-heading"><p className="eyebrow">One shared process</p><h2>Built around the people in the chain.</h2></div><p className="participants-intro">Each participant records or uses the information relevant to their role, helping records move clearly from farm to consumer.</p></div>
        <div className="participant-grid">
          <ParticipantCard icon={Tractor} index="01" title="Farmers" description="Keep cattle identity and health details together with farm records." />
          <ParticipantCard icon={Stethoscope} index="02" title="Veterinarians" description="Document treatments and the withdrawal guidance associated with them." />
          <ParticipantCard icon={Building2} index="03" title="Collection centres" description="Review collection information and connect milk to its source records." />
          <ParticipantCard icon={Factory} index="04" title="Factories" description="Link incoming milk batches with processing and package records." />
          <ParticipantCard icon={ScanLine} index="05" title="Consumers" description="Use package-level verification when a consumer lookup service is available." />
        </div>
      </div>
    </section>

    <section className="disclaimer-section section-pad">
      <div className="disclaimer-card"><span className="disclaimer-icon"><ShieldCheck size={23} aria-hidden="true" /></span><div><p className="eyebrow">A note on compliance</p><h2>Clear records support better decisions.</h2><p>ResiduGuard records treatment and compliance information to support dairy supply-chain workflows. The portal does not itself perform laboratory residue detection or certify that a product is residue-free.</p></div></div>
    </section>

    <section id="consumer-verification" className="consumer-section section-pad">
      <div className="consumer-inner"><div><p className="eyebrow eyebrow-light">For consumers</p><h2>Traceability should be easy to understand.</h2><p>Package-level consumer verification depends on a connected verification service. When available, this is where a batch lookup can begin.</p></div><div className="consumer-action"><span className="consumer-scan-icon"><ScanLine size={27} aria-hidden="true" /></span><span className="consumer-action-copy"><b>Consumer verification</b><small>Batch lookup service not connected yet</small></span><span className="consumer-soon">In development</span></div></div>
    </section>
  </>;
}
