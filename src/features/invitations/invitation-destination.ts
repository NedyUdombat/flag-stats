import type { AcceptedInvitation, InvitationType } from "./invitation.types";

/** Where to land after accepting. Edit the routes here only. */
export function invitationDestination(r: AcceptedInvitation | null): string {
  if (!r) return "/account";
  switch (r.type) {
    case "athlete_claim":
      return "/account?tab=athlete";
    case "team_claim":
      return r.team_id
        ? `/admin/teams/${r.team_id}?claimed=1`
        : "/account?tab=teams";
    case "league_claim":
      return r.league_id
        ? `/admin/leagues/${r.league_id}?claimed=1`
        : "/account?tab=teams";
    case "team_join":
      return "/account?tab=teams&joined=1";
    case "org_claim":
      return "/account?tab=teams"; // /admin/organizations/<id> in the Organisations phase
  }
}

export const INVITATION_COPY: Record<
  InvitationType,
  { title: (label: string) => string; description: string; accept: string }
> = {
  athlete_claim: {
    title: (l) => `Claim ${l}`,
    description: "Accept to add this athlete profile to your account.",
    accept: "Claim profile",
  },
  team_claim: {
    title: (l) => `Manage ${l}`,
    description: "You'll become an admin of this team and can set it up.",
    accept: "Accept and manage team",
  },
  team_join: {
    title: (l) => `Join ${l}`,
    description:
      "You'll be added to the team's athlete pool. Your profile and record stay yours.",
    accept: "Join team",
  },
  league_claim: {
    title: (l) => `Manage ${l}`,
    description: "You'll become an admin of this league and can set it up.",
    accept: "Accept and manage league",
  },
  org_claim: {
    title: (l) => `Manage ${l}`,
    description: "You'll become an admin of this federation.",
    accept: "Accept and manage federation",
  },
};
