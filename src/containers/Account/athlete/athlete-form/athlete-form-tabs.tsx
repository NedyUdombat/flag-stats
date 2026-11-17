import { CheckIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { STEPS } from "../athlete-form.logic";

interface AthleteFormTabsProps {
  step: number;
  goTo: (step: number) => void;
  canGo: (step: number) => boolean;
}

export function AthleteFormTabs({ step, goTo, canGo }: AthleteFormTabsProps) {
  return (
    <ol
      aria-label="Steps"
      className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-4"
    >
      {STEPS.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => goTo(i)}
            disabled={!canGo(i)}
            aria-current={step === i ? "step" : undefined}
            className={cn(
              "cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left font-sans text-xs font-semibold uppercase tracking-[.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              step === i
                ? "bg-zs-raised text-accent-gold"
                : "text-zs-muted hover:text-zs-ink",
            )}
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border text-xs",
                step === i
                  ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "border-white/10 bg-white/3 text-slate-500",
              )}
            >
              {i < step ? (
                <CheckIcon className="size-3.5" aria-hidden />
              ) : (
                i + 1
              )}
            </span>
            {s.label}
          </button>
        </li>
      ))}
    </ol>
  );
}
