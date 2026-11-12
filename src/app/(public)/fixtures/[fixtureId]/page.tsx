import { notFound } from "next/navigation";
import { FixtureGameCentre } from "@/containers/Fixtures/game-centre";
import { getFixtureGameCentre } from "@/features/stats/services/fixture-game-centre.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Fixture Game Centre" };

export default async function PublicFixturePage({
  params,
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  const { fixtureId } = await params;
  if (!UUID.test(fixtureId)) notFound();
  const game = await getFixtureGameCentre(fixtureId);
  if (!game) notFound();

  const fixture = game.fixture;
  if (!fixture.home || !fixture.away) notFound();
  return (
    <FixtureGameCentre
      fixture={{
        id: fixture.id,
        status: fixture.status,
        voided: fixture.voidedAt !== null,
        scheduledAt: fixture.scheduledAt,
        venue: fixture.venue,
        pitch: fixture.pitch,
        tournament: {
          name: fixture.tournament.name,
          leagueName: fixture.tournament.leagueName,
        },
        home: {
          id: fixture.home.id,
          name: fixture.home.name,
          logoUrl: fixture.home.logoUrl,
        },
        away: {
          id: fixture.away.id,
          name: fixture.away.name,
          logoUrl: fixture.away.logoUrl,
        },
        result: fixture.result
          ? {
              homeScore: fixture.result.homeScore,
              awayScore: fixture.result.awayScore,
              status: fixture.result.status,
            }
          : null,
      }}
      players={game.players}
    />
  );
}
