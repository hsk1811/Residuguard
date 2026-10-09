import type { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  trailing?: ReactNode;
}

export function FormField({ label, id, error, hint, trailing, ...props }: FormFieldProps) {
  const inputId = id ?? props.name;
  const hintId = `${inputId}-hint`;
  return (
    <div className="space-y-1.5">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <div className="relative">
        <input id={inputId} className={`field-input ${trailing ? "field-input-trailing" : ""}`} aria-invalid={Boolean(error)} aria-describedby={error || hint ? hintId : undefined} {...props} />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      {(error || hint) && <p id={hintId} className={error ? "text-sm text-red-700" : "text-sm text-stone-500"} role={error ? "alert" : undefined}>{error ?? hint}</p>}
    </div>
  );
}
