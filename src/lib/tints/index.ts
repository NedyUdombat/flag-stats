import { ATHLETE_TINTS, LEAGUE_TINTS, TEAMS_TINTS } from "./tints";

export function getAthleteTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ATHLETE_TINTS.length;
  return ATHLETE_TINTS[index];
}

export function getLeagueTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LEAGUE_TINTS.length;
  return LEAGUE_TINTS[index];
}

export function getTeamTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TEAMS_TINTS.length;
  return TEAMS_TINTS[index];
}
