import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/utils/cn";
import { AuthBrand } from "./auth-brand";
import { AuthHeading } from "./auth-heading";

interface AuthShellProps {
  children: React.ReactNode;
  backLink?: { href: string; label: string };
  size?: "sm" | "md";
  headline?: string;
  supporting?: React.ReactNode;
}

export function AuthShell({
  children,
  backLink,
  size = "sm",
  headline,
  supporting,
}: AuthShellProps) {
  return (
    <div className="dark relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-128 bg-[radial-gradient(ellipse_45%_60%_at_50%_0%,color-mix(in_oklab,var(--color-brand-lime)_14%,transparent),transparent)]"
      />

      <div
        className={cn(
          "relative w-full",
          size === "md" ? "max-w-160" : "max-w-136",
        )}
      >
        {backLink ? (
          <Link
            href={backLink.href}
            className="mb-4 inline-flex items-center gap-2 rounded-sm font-display text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-lime"
          >
            <ArrowLeftIcon aria-hidden className="size-4" />
            {backLink.label}
          </Link>
        ) : null}

        <div className="relative overflow-hidden rounded-lg border border-white/5 bg-card px-6 py-10 shadow-2xl shadow-black/40 sm:px-12 sm:py-12">
          <div
            aria-hidden
            className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-brand-lime to-transparent"
          />
          <AuthBrand />
          {headline ? (
            <div className="mt-8">
              <AuthHeading title={headline} description={supporting} />
            </div>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Having trouble?{" "}
          <Link
            href="/contact?topic=account"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
