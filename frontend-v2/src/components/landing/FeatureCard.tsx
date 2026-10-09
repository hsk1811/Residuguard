import type { LucideIcon } from "lucide-react";

export interface FeatureCardProps {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, number, title, description }: FeatureCardProps) {
  return <article className="landing-card feature-card">
    <div className="feature-card-top"><span className="icon-tile"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span><span className="feature-number">{number}</span></div>
    <h3>{title}</h3><p>{description}</p>
  </article>;
}
