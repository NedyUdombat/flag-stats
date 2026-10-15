interface AthleteCareerSummaryProps {
  careerSummary: {
    gamesPlayed: number;
    gamesWon: number;
    winPct: number;
    flagsPulled: number;
    touchdowns: number;
    receptions: number;
    passingTouchdowns: number;
    interceptions: number;
    tournamentsPlayed: number;
    teamsPlayedFor: number;
  };
}
export async function AthleteCareerSummary({
  careerSummary,
}: AthleteCareerSummaryProps) {
  return (
    <section
      id="athlete-career-summary"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black p-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col">
        <p className="mb-3 font-data text-[10px] tracking-wide text-brand-lime uppercase">
          Career telemetry summary
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Matches played", value: careerSummary.gamesPlayed },
            { label: "Matches Won", value: careerSummary.gamesWon },
            { label: "Win %", value: careerSummary.winPct },
            { label: "Teams played for", value: careerSummary.teamsPlayedFor },
            {
              label: "Tournaments played",
              value: careerSummary.tournamentsPlayed,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/10 bg-neutral-covert p-4 text-center"
            >
              <p className="text-brand-lime text-[30px] font-black tracking-[-4px] text-accent-gold font-mono">
                {s.value || 0}
              </p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[.12em] text-white/80">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
