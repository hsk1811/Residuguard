import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

export function ConfirmDialog({ open, title, children, onCancel, onConfirm, confirmLabel = "Confirm" }: {
  open: boolean; title: string; children: ReactNode; onCancel: () => void; onConfirm: () => void; confirmLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <h2 id="confirm-title" className="text-lg font-semibold text-stone-900">{title}</h2>
    <div className="mt-2 text-sm leading-6 text-stone-600">{children}</div>
    <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div>
  </dialog>;
}
