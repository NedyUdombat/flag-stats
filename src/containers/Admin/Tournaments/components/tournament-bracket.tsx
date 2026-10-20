// biome-ignore lint/suspicious/noExplicitAny: temporary
export function TournamentBracket({ bracketRows }: { bracketRows: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold uppercase text-zs-ink">
        Knockout Bracket
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bracketRows.map((match) => (
          <div
            key={match.fixture_id}
            className="border border-zs-line bg-zs-panel p-4 space-y-2"
          >
            <div className="flex justify-between text-xs text-zs-muted font-data">
              <span>
                Round {match.round} · Match {match.match_no}
              </span>
              <span className="uppercase">{match.status}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center bg-zs-raised p-2">
                <span className="font-display font-bold text-sm">
                  {match.home_team_name ?? "TBD"}
                </span>
                <span className="font-data font-bold">
                  {match.home_score ?? "-"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zs-raised p-2">
                <span className="font-display font-bold text-sm">
                  {match.away_team_name ?? "TBD"}
                </span>
                <span className="font-data font-bold">
                  {match.away_score ?? "-"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
