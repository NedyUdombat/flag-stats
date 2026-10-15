import Link from "next/link";

interface TeamStatsDisclaimerProps {
  canSubmit: boolean;
}

export async function TeamStatsDisclaimer({
  canSubmit,
}: TeamStatsDisclaimerProps) {
  return (
    <section
      id="team-stats-disclaimer"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6 py-4 mt-4"
    >
      <div className="max-w-6xl w-full flex flex-col gap-4 rounded-lg bg-white/2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display uppercase text-white">
            Club verification protocol
            <span className="rounded-sm bg-verified-green/15 px-2 py-0.5 font-mono text-[10px] text-verified-green">
              Active
            </span>
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/60">
            Teams receive verified status once tournament rosters are approved
            and official match history is logged.
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
            href={canSubmit ? "/admin/teams/new" : "/sign-up"}
            className="rounded-sm bg-accent px-4 py-2 font-mono font-medium text-xs tracking-wide text-black uppercase hover:bg-accent/80"
          >
            Register club or team
          </Link>
        </div>
      </div>
    </section>
  );
}
