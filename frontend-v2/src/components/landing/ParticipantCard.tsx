import type { LucideIcon } from "lucide-react";

export function ParticipantCard({ icon: Icon, title, description, index }: { icon: LucideIcon; title: string; description: string; index: string }) {
  return <article className="participant-card">
    <span className="participant-index">{index}</span><span className="participant-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
    <h3>{title}</h3><p>{description}</p>
  </article>;
}
