interface LeagueTelemetrySummaryProps {
  telemetry: {
    teamsCount: number;
    tournamentsCount: number;
    matchesPlayed: number;
    totalFixtures: number;
    verifiedAthletesPct: number;
  };
}

export async function LeagueTelemetrySummary({
  telemetry,
}: LeagueTelemetrySummaryProps) {
  return (
    <section
      id="league-telemetry-summary"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black p-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col">
        <p className="mb-3 font-data text-[12px] tracking-wide text-brand-lime uppercase">
          League Telemetry & Metrics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Matches logged", value: telemetry.matchesPlayed },
            { label: "Tournaments hosted", value: telemetry.tournamentsCount },
            { label: "Registered clubs", value: telemetry.teamsCount },
            {
              label: "Verified athletes",
              value: `${telemetry.verifiedAthletesPct}%`,
            },
            { label: "Total fixtures", value: telemetry.totalFixtures },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-neutral-covert p-4 text-center"
            >
              <p className="text-[30px] font-black tracking-[-4px] text-accent-gold font-mono">
                {s.value ?? 0}
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
