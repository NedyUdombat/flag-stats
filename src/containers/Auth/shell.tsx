import Link from "next/link";
import { cn } from "@/utils/cn";
import { AuthHeading } from "./auth-heading";

interface AuthShellProps {
  children: React.ReactNode;
  size?: "sm" | "md";
  headline: string;
  supporting?: React.ReactNode;
  icon?: React.ReactNode;
}

export async function AuthShell({
  children,
  size = "sm",
  headline,
  supporting,
  icon,
}: AuthShellProps) {
  return (
    <div className="pt-30 dark relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-neutral-black px-4 py-12 text-foreground sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-128 bg-[radial-gradient(ellipse_45%_60%_at_50%_0%,color-mix(in_oklab,var(--accent-gold)_18%,transparent),transparent)]"
      />

      <div
        className={cn(
          "relative w-full",
          size === "md" ? "max-w-160" : "max-w-136",
        )}
      >
        <div className="relative overflow-hidden rounded-lg border border-white/5 bg-neutral-gray-1 px-6 py-10 shadow-2xl shadow-black/60 sm:px-12 sm:py-12">
          <div
            aria-hidden
            className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-accent-gold to-transparent"
          />
          {icon ? (
            <div className="flex items-center justify-center">{icon}</div>
          ) : null}
          <AuthHeading title={headline} description={supporting} />
          <div className="mt-8">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Having trouble?{" "}
          <Link
            href="/contact?topic=account"
            className="text-foreground underline-offset-4 hover:underline hover:text-accent-blue"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
