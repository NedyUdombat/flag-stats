"use server";

import { logServerError } from "@/lib/errors";
import { canCreateTeamShell } from "@/lib/permissions";
import { runCreate } from "../../entities/run-create";
import type { EntityActionState } from "../../entities/shared";
import { CreateAdminTeamSchema, readCreateAdminTeamForm } from "../team.schema";
import { createTeam } from "../team.service";
import { sendTeamAdminInvitation } from "../team-invitation.service";

/** Admin-specific adapter; actual team creation uses the shared pipeline/service. */
export async function createTeamShellAction(
  _prev: EntityActionState,
  fd: FormData,
): Promise<EntityActionState> {
  let invitationSent: boolean | undefined;

  return runCreate({
    kind: "team",
    schema: CreateAdminTeamSchema,
    raw: readCreateAdminTeamForm(fd),
    allowed: canCreateTeamShell,
    create: ({ adminEmail: _adminEmail, ...teamInput }) =>
      createTeam(teamInput),
    // Preserve the admin entry point's existing 30 creations/day allowance.
    rateLimit: { key: "team-shell", limit: 30, windowSeconds: 86400 },
    afterCreate: async ({ id, data, user }) => {
      if (!data.adminEmail) return;

      try {
        const result = await sendTeamAdminInvitation({
          teamId: id,
          teamName: data.name,
          email: data.adminEmail,
          invitedByName: user.fullName ?? null,
        });
        invitationSent = result.ok && result.emailSent;
      } catch (error) {
        // The team already exists; invitation errors must not fail creation.
        logServerError("team.shell.invitation", error);
        invitationSent = false;
      }
    },
    redirectTo: ({ id, data }) =>
      `/admin/teams/${id}?tab=admins&created=1${
        data.adminEmail ? `&sent=${invitationSent ? "1" : "0"}` : ""
      }`,
  });
}
