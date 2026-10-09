import { LoaderCircle, PackageOpen } from "lucide-react";

export function LoadingIndicator({ label = "Loading" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-600" role="status"><LoaderCircle className="animate-spin" size={18} aria-hidden="true" />{label}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><PackageOpen size={25} className="mb-3 text-stone-400" aria-hidden="true" /><h2 className="font-semibold text-stone-800">{title}</h2><p className="mt-1 text-sm text-stone-500">{description}</p></div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <div className="error-message" role="alert">{message}</div>;
}
