import { AlertCircleIcon, type LucideIcon } from "lucide-react";

import { Label } from "@/components/primitives/label";
import { fieldLabelClass } from "@/containers/Auth/styles";
import { cn } from "@/utils/cn";

interface FormFieldProps {
  id: string;
  label?: string;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required = false,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex min-h-4 items-baseline justify-between gap-3">
        {label && (
          <Label htmlFor={id} className={cn(fieldLabelClass, "font-data")}>
            {label}
          </Label>
        )}
        {hint ??
          (required ? (
            <span aria-hidden className="text-sm leading-none text-destructive">
              *
            </span>
          ) : null)}
      </div>
      {children}
    </div>
  );
}

export function FieldHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("font-mono text-[0.7rem] text-muted-foreground", className)}
    >
      {children}
    </span>
  );
}

export function InputWithIcon({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      <Icon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {children}
    </div>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-sm bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
