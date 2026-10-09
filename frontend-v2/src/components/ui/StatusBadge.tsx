import type { ReactNode } from "react";

type StatusTone = "safe" | "hold" | "neutral" | "danger";
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`status-badge status-${tone}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{children}</span>;
}
