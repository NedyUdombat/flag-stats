import { notFound } from "next/navigation";
import { AthleteCareerSummary } from "@/containers/Athletes/athlete-career-summary";
import { AthleteSummary } from "@/containers/Athletes/athlete-summary";
// import { AthletePassportActions } from "@/features/athletes/components/athlete-passport-actions";
import {
  // getAthleteCareerPathway,
  getAthletePassportSummary,
  // getAthleteRecentMatches,
} from "@/features/athletes/athlete-passport.service";

// import { AthleteProfileFacts } from "@/features/public-profiles/components/profile-facts";
// import { getAthletePublicDetails } from "@/features/public-profiles/services/public-details.service";

interface AthletePageProps {
  params: Promise<{ id: string }>;
}

export default async function AthletePassportPage({
  params,
}: AthletePageProps) {
  const { id: slug } = await params;
  const summary = await getAthletePassportSummary(slug);
  if (!summary) notFound();

  // const [pathway, { matches, total }, details] = await Promise.all([
  //   getAthleteCareerPathway(summary.id),
  //   getAthleteRecentMatches(summary.id),
  //   getAthletePublicDetails(summary.id),
  // ]);

  const _url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/athletes/${summary.slug}`;

  return (
    <div className="">
      <AthleteSummary summary={summary} />
      <AthleteCareerSummary careerSummary={summary.careerTotals} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* {summary.catchRate !== null || summary.redzoneConversion !== null ? (
          <div className="mt-10">
            <p className="mb-3 font-mono text-[10px] tracking-wide text-brand-lime uppercase">
              Performance splits · computed from verified stats
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
                <p className="font-mono text-[10px] tracking-wide text-white/40 uppercase">
                  Offensive splits
                </p>
                <div className="mt-3 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Catch rate (targeted)</span>
                    <span className="text-brand-lime">
                      {summary.catchRate !== null
                        ? `${summary.catchRate}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">
                      Yards after catch (avg)
                    </span>
                    <span className="text-white">
                      {summary.yardsAfterCatchAvg !== null
                        ? `${summary.yardsAfterCatchAvg} yds`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Redzone TD conversion</span>
                    <span className="text-brand-lime">
                      {summary.redzoneConversion !== null
                        ? `${summary.redzoneConversion}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
                <p className="font-mono text-[10px] tracking-wide text-white/40 uppercase">
                  Defensive &amp; discipline
                </p>
                <div className="mt-3 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Pass breakups</span>
                    <span className="text-white">{summary.passBreakups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Interceptions</span>
                    <span className="text-brand-lime">
                      {summary.interceptions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Penalties (career)</span>
                    <span className="text-white">{summary.penalties}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {pathway.length > 0 ? (
          <div className="mt-10">
            <p className="mb-3 font-mono text-[10px] tracking-wide text-brand-lime uppercase">
              Career pathway
            </p>
            <div className="space-y-3">
              {pathway.map((stint, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-base uppercase">
                      {stint.teamName}
                    </p>
                    {stint.current ? (
                      <span className="rounded-sm bg-brand-lime/15 px-2 py-0.5 font-mono text-[10px] text-brand-lime uppercase">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-white/40 uppercase">
                    {stint.seasonLabel} {stint.role ? `· ${stint.role}` : ""}
                  </p>
                  <div className="mt-3 flex gap-6 border-t border-white/10 pt-3 font-mono text-xs">
                    <span>
                      <span className="text-white">{stint.apps}</span>{" "}
                      <span className="text-white/40">Apps</span>
                    </span>
                    <span>
                      <span className="text-brand-lime">
                        {stint.touchdowns}
                      </span>{" "}
                      <span className="text-white/40">TDs</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {matches.length > 0 ? (
          <div className="mt-10">
            <p className="mb-1 font-mono text-[10px] tracking-wide text-brand-lime uppercase">
              Verified match appearances
            </p>
            <h2 className="mb-4 font-display text-2xl tracking-tight uppercase">
              Recent form
            </h2>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-white/40 uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Competition</th>
                    <th className="px-4 py-3">Opponent</th>
                    <th className="px-3 py-3 text-center">Score</th>
                    <th className="px-3 py-3 text-center">Result</th>
                    <th className="px-3 py-3 text-center">Rec</th>
                    <th className="px-3 py-3 text-center">TD</th>
                    <th className="px-3 py-3 text-center">Pulls</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr
                      key={m.fixtureId}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-white/50">
                        {new Date(m.scheduledAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {m.leagueName}
                      </td>
                      <td className="px-4 py-3 text-white uppercase">
                        vs {m.opponentName}
                      </td>
                      <td className="px-3 py-3 text-center text-white">
                        {m.homeScore ?? "–"} – {m.awayScore ?? "–"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.result ? (
                          <span
                            className={`rounded-sm px-2 py-0.5 text-[10px] uppercase ${
                              m.result === "W"
                                ? "bg-brand-lime/15 text-brand-lime"
                                : m.result === "D"
                                  ? "bg-white/10 text-white"
                                  : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {m.result === "W"
                              ? "Win"
                              : m.result === "D"
                                ? "Draw"
                                : "Loss"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-white">
                        {m.receptions}
                      </td>
                      <td className="px-3 py-3 text-center text-brand-lime">
                        {m.touchdowns}
                      </td>
                      <td className="px-3 py-3 text-center text-white">
                        {m.flagsPulled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 font-mono text-[10px] text-white/30 uppercase">
              Showing {matches.length} of {total} verified matches
            </p>
          </div>
        ) : null} */}
      </div>
    </div>
  );
}
