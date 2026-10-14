import Link from "next/link";
import type {
  PublicRosterPlayer,
  PublicRosterTeam,
} from "@/features/rosters/roster.types";

export function PublicRosterTable({
  players,
}: {
  players: PublicRosterPlayer[];
}) {
  if (players.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No roster published yet.</p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-sm">
        <thead>
          <tr className="border-b text-left font-display text-xs tracking-wider text-muted-foreground uppercase">
            <th scope="col" className="w-16 py-2 pr-3">
              #
            </th>
            <th scope="col" className="py-2 pr-3">
              Player
            </th>
            <th scope="col" className="py-2">
              Position
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={`${p.jerseyNumber}-${p.displayName}`}
              className="border-b last:border-b-0"
            >
              <td className="py-2 pr-3 font-data tabular-nums">
                #{String(p.jerseyNumber).padStart(2, "0")}
              </td>
              <td className="py-2 pr-3">
                <span className="inline-flex items-center gap-2">
                  {p.photoUrl && (
                    <span
                      aria-hidden
                      className="size-7 shrink-0 rounded-full bg-muted bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${p.photoUrl.replace(/"/g, "%22")}")`,
                      }}
                    />
                  )}
                  {p.athleteSlug ? (
                    <Link
                      href={`/athletes/${p.athleteSlug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {p.displayName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      {p.displayName}
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2">{p.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PublicTournamentRosters({
  teams,
}: {
  teams: PublicRosterTeam[];
}) {
  if (teams.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No rosters published yet.</p>
    );
  return (
    <div className="space-y-8">
      {teams.map((t) => (
        <section
          key={t.teamId}
          aria-labelledby={`roster-${t.teamId}`}
          className="space-y-3"
        >
          <h3
            id={`roster-${t.teamId}`}
            className="font-display text-xl tracking-wide uppercase"
          >
            <Link href={`/teams/${t.teamSlug}`} className="hover:underline">
              {t.teamName}
            </Link>
          </h3>
          <PublicRosterTable players={t.players} />
        </section>
      ))}
    </div>
  );
}
