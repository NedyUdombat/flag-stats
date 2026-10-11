"use client";

import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { cn } from "@/utils/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standard error state. Never render raw database/server error messages here —
 * pass a user-safe `description` (see lib/errors.ts:getSafeErrorMessage).
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangleIcon className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcwIcon className="size-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
