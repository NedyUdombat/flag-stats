import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { PublicRosterTeam } from "./roster.types";

/** Privacy rules live in the database function, so this is safe for public pages. */
export async function getPublicTournamentRoster(
  tournamentId: string,
  teamId?: string,
): Promise<PublicRosterTeam[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("public_tournament_roster", {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  });
  if (error) return [];
  const teams = new Map<string, PublicRosterTeam>();
  for (const r of data ?? []) {
    const team = teams.get(r.team_id) ?? {
      teamId: r.team_id,
      teamName: r.team_name,
      teamSlug: r.team_slug,
      logoUrl: r.team_logo_url,
      players: [],
    };
    team.players.push({
      jerseyNumber: r.jersey_number,
      position: r.position,
      displayName: r.display_name,
      athleteSlug: r.athlete_slug,
      photoUrl: r.photo_url,
      masked: r.masked,
    });
    teams.set(r.team_id, team);
  }
  return [...teams.values()];
}
