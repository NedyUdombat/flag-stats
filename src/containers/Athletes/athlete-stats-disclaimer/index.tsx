import Link from "next/link";

interface AthleteStatsDisclaimerProps {
  canSubmit: boolean;
}

export async function AthleteStatsDisclaimer({
  canSubmit,
}: AthleteStatsDisclaimerProps) {
  return (
    <section
      id="athlete-stats-disclaimer"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6 py-4 mt-4"
    >
      <div className="max-w-6xl w-full flex flex-col gap-4 rounded-lg bg-white/2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display uppercase">
            Statistics verification protocol
            <span className="rounded-sm bg-verified-green/15 px-2 py-0.5 font-mono text-[10px] text-verified-green">
              Active
            </span>
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/60">
            Every stat shown above is only public once a league admin has
            reviewed and approved it.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/contact"
            className="rounded-sm border border-white/10 px-4 py-2 font-mono text-xs tracking-wide text-white/70 uppercase hover:border-accent hover:text-accent"
          >
            Verification standards
          </Link>
          <Link
            href={canSubmit ? "/admin/athletes/new" : "/sign-up"}
            className="rounded-sm bg-accent px-4 py-2 font-mono font-medium text-xs tracking-wide text-black uppercase hover:bg-accent/80"
          >
            Submit athlete record
          </Link>
        </div>
      </div>
    </section>
  );
}
