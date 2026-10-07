import "server-only";
import { getRosterFormOptions } from "../athletes/athlete.service";
import { getLeagueOptions } from "../leagues/league.service";
import { getOrganizationOptions } from "../organizations/organization.service";

export interface SignupScopeOptions {
  teams: { id: string; name: string }[];
  leagues: { id: string; name: string }[];
  organizations: { id: string; name: string }[];
}

export async function getSignupScopeOptions(): Promise<SignupScopeOptions> {
  const [{ teams }, leagues, organizations] = await Promise.all([
    getRosterFormOptions(),
    getLeagueOptions(),
    getOrganizationOptions(),
  ]);

  return { teams, leagues, organizations };
}
