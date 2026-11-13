import type { ReactNode } from "react";
import { fieldHint, fieldLabel } from "../styles";

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={`${fieldLabel} mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500`}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-zs-coral">{error}</p>
      ) : hint ? (
        <p className={fieldHint}>{hint}</p>
      ) : null}
    </div>
  );
}
