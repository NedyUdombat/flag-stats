import { rankStandings } from "@/features/tournaments/standings/rank";
import type { Tiebreaker } from "@/features/tournaments/structure/structure.constants";
import type {
  PairResult,
  StandingRow,
} from "@/features/tournaments/structure/structure.types";

export function TournamentStandings({
  standings,
  pairs,
  tiebreakers,
}: {
  standings: StandingRow[];
  pairs: PairResult[];
  tiebreakers: Tiebreaker[];
}) {
  const ranked = rankStandings(standings, pairs, tiebreakers);

  return (
    <div className="overflow-x-auto border border-zs-line bg-zs-panel">
      <table className="w-full text-left border-collapse text-zs-ink">
        <thead>
          <tr className="border-b border-zs-line bg-zs-raised text-xs font-display uppercase">
            <th className="p-3">Rank</th>
            <th className="p-3">Team</th>
            <th className="p-3">P</th>
            <th className="p-3">W</th>
            <th className="p-3">D</th>
            <th className="p-3">L</th>
            <th className="p-3">GF</th>
            <th className="p-3">GA</th>
            <th className="p-3">GD</th>
            <th className="p-3">Pts</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr
              key={row.teamId}
              className="border-b border-zs-line/50 hover:bg-zs-raised/30"
            >
              <td className="p-3 font-data font-bold">
                {row.rank}
                {row.tied ? "*" : ""}
              </td>
              <td className="p-3 font-display font-bold">{row.teamName}</td>
              <td className="p-3 font-data">{row.gamesPlayed}</td>
              <td className="p-3 font-data">{row.wins}</td>
              <td className="p-3 font-data">{row.draws}</td>
              <td className="p-3 font-data">{row.losses}</td>
              <td className="p-3 font-data">{row.pointsFor}</td>
              <td className="p-3 font-data">{row.pointsAgainst}</td>
              <td className="p-3 font-data">{row.pointDifferential}</td>
              <td className="p-3 font-data font-bold text-zs-lime">
                {row.standingsPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
