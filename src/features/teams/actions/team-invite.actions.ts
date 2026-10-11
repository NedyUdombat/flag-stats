"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "../../entities/shared";
import { InviteTeamAdminSchema, readInviteTeamAdminForm } from "../team.schema";
import {
  addTeamMember,
  getTeam,
  removeTeamMember,
  revokeTeamInvitation,
  searchInvitableAthletes,
} from "../team.service";
import {
  type AthleteSearchResult,
  type TeamActionState,
  teamError,
  teamOk,
} from "../team.types";
import {
  sendTeamAdminInvitation,
  sendTeamJoinInvitation,
} from "../team-invitation.service";

const denied = teamError("You don't have permission to do that.");
const tooMany = teamError("Too many invitations. Please try again later.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;
const refresh = (teamId: string) => revalidatePath(`/admin/teams/${teamId}`);
const sentMessage = (emailSent: boolean) =>
  emailSent
    ? "Invitation sent."
    : "Invitation created, but the email could not be sent. Invite again to retry.";

export async function inviteTeamAdminAction(
  teamId: string,
  _prev: TeamActionState,
  fd: FormData,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(teamId) || !canManageTeam(user, teamId)) return denied;
  const parsed = InviteTeamAdminSchema.safeParse(readInviteTeamAdminForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!(await rateLimit(rateKey("team-invite", user.id), 30, 3600)))
    return tooMany;
  const team = await getTeam(teamId);
  if (!team) return teamError("Team not found.");
  const res = await sendTeamAdminInvitation({
    teamId,
    teamName: team.name,
    email: parsed.data.email,
    invitedByName: user.fullName ?? null,
  });
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk(sentMessage(res.emailSent));
}

export async function inviteTeamAthleteAction(
  teamId: string,
  athleteId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (
    !user ||
    !isUuid(teamId) ||
    !isUuid(athleteId) ||
    !canManageTeam(user, teamId)
  )
    return denied;
  if (!(await rateLimit(rateKey("team-invite", user.id), 30, 3600)))
    return tooMany;
  const team = await getTeam(teamId);
  if (!team) return teamError("Team not found.");
  const res = await sendTeamJoinInvitation({
    teamId,
    teamName: team.name,
    athleteId,
    invitedByName: user.fullName ?? null,
  });
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk(sentMessage(res.emailSent));
}

export async function revokeTeamInvitationAction(
  teamId: string,
  invitationId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!isUuid(teamId) || !isUuid(invitationId) || !canManageTeam(user, teamId))
    return denied;
  const res = await revokeTeamInvitation(invitationId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk();
}

export async function addTeamMemberAction(
  teamId: string,
  athleteId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!isUuid(teamId) || !isUuid(athleteId) || !canManageTeam(user, teamId))
    return denied;
  const res = await addTeamMember(teamId, athleteId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk("Athlete added to the team.");
}

export async function removeTeamMemberAction(
  teamId: string,
  athleteId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!isUuid(teamId) || !isUuid(athleteId) || !canManageTeam(user, teamId))
    return denied;
  const res = await removeTeamMember(teamId, athleteId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk();
}

export async function searchInvitableAthletesAction(
  teamId: string,
  q: string,
): Promise<AthleteSearchResult[]> {
  const user = await getCurrentUser();
  if (!user || !isUuid(teamId) || !canManageTeam(user, teamId)) return [];
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return [];
  if (!(await rateLimit(rateKey("team-athlete-search", user.id), 60, 60)))
    return [];
  return searchInvitableAthletes(teamId, term);
}
