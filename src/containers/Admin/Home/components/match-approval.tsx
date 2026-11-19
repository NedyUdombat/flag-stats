import { ArrowRight, Flag } from "lucide-react";
import Link from "next/link";

import type { DashboardMatch } from "../types";

export function MatchApprovals({
  matches,
  userCanVerify,
}: {
  matches: DashboardMatch[];
  userCanVerify: boolean;
}) {
  return (
    <section className="rounded-xl border border-[#272B35] bg-[#11141B] p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">
          Match approvals & recent games
        </h2>

        <Link
          href="/admin/fixtures"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-[#FACC15]"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex flex-col gap-3 rounded-lg border border-[#303643] bg-[#171B24] p-3 transition hover:border-[#454C5B] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#252B37] text-slate-300">
                <Flag size={17} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {match.home}
                  <span className="px-1 text-slate-500">vs</span>
                  {match.away}
                </p>

                <p className="mt-1 text-xs text-slate-500">Recent fixture</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="whitespace-nowrap text-sm font-bold tabular-nums text-white">
                {match.score}
              </p>

              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                  match.status === "Approved"
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                }`}
              >
                {match.status}
              </span>

              <Link
                href={
                  match.status === "Pending review" && userCanVerify
                    ? "/admin/verifications"
                    : "/admin/fixtures"
                }
                className="rounded-md border border-[#414958] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-[#FACC15] hover:text-[#FACC15]"
              >
                {match.status === "Pending review" && userCanVerify
                  ? "Review"
                  : "View"}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Showing {matches.length} recent fixtures.
      </p>
    </section>
  );
}
