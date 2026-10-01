"use client";

import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";
import { cn } from "@/utils/cn";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const total = PASSWORD_REQUIREMENTS.length;
  const unmet = PASSWORD_REQUIREMENTS.filter((req) => !req.test(password));
  const metCount = total - unmet.length;
  const ratio = metCount / total;
  const fill =
    ratio === 1
      ? "bg-brand-lime"
      : ratio >= 0.5
        ? "bg-brand-orange"
        : "bg-destructive";

  return (
    <div className="space-y-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {PASSWORD_REQUIREMENTS.map((req, i) => (
          <span
            key={req.id}
            className={cn(
              "h-1 rounded-full bg-border transition-colors",
              password && i < metCount && fill,
            )}
          />
        ))}
      </div>
      <div
        className="flex justify-between gap-4 font-mono text-[0.7rem] text-muted-foreground"
        aria-live="polite"
      >
        <span>
          {password
            ? `${metCount} of ${total} requirements met`
            : "Requirements"}
        </span>
        <span className="text-right">
          {unmet.length ? `Next: ${unmet[0].label}` : "Good to go"}
        </span>
      </div>
    </div>
  );
}
