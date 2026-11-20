"use server";

import { runCreate } from "@/features/entities/run-create";
import { logServerError } from "@/lib/errors";
import { canCreateLeagueShell } from "@/lib/permissions";
import {
  CreateAdminLeagueSchema,
  readCreateLeagueShellForm,
} from "../league.schema";
import { createLeague } from "../league.service";
import type { LeagueActionState } from "../league.types";
import { sendLeagueAdminInvitation } from "../league-invitation.service";

export async function createLeagueShellAction(
  _prev: LeagueActionState,
  fd: FormData,
): Promise<LeagueActionState> {
  let invitationSent: boolean | undefined;

  return runCreate({
    kind: "league",
    schema: CreateAdminLeagueSchema,
    raw: readCreateLeagueShellForm(fd),
    allowed: canCreateLeagueShell,
    create: ({ adminEmail: _adminEmail, ...leagueInput }) =>
      createLeague(leagueInput),
    // Preserve the league admin entry point's existing 30 creations/day allowance.
    rateLimit: { key: "league-shell", limit: 30, windowSeconds: 86400 },
    afterCreate: async ({ id, data, user }) => {
      if (!data.adminEmail) return;

      try {
        const result = await sendLeagueAdminInvitation({
          leagueId: id,
          leagueName: data.name,
          email: data.adminEmail,
          invitedByName: user.fullName ?? null,
        });

        invitationSent = result.ok && result.emailSent;
      } catch (error) {
        // The league already exists; invitation errors must not fail creation.
        logServerError("league.shell.invitation", error);
        invitationSent = false;
      }
    },
    redirectTo: ({ id, data }) =>
      `/admin/leagues/${id}?tab=admins&created=1${
        data.adminEmail ? `&sent=${invitationSent ? "1" : "0"}` : ""
      }`,
  });
}
// export async function createLeagueShellAction(
//   _prev: LeagueActionState,
//   fd: FormData,
// ): Promise<LeagueActionState> {
//   const user = await getCurrentUser();
//   if (!user || !canCreateLeagueShell(user))
//     return leagueError("You don't have permission to do that.");
//   const parsed = CreateLeagueShellSchema.safeParse(
//     readCreateLeagueShellForm(fd),
//   );
//   if (!parsed.success) return fieldErrorsFrom(parsed.error);
//   if (!(await rateLimit(rateKey("league-shell", user.id), 30, 86400))) {
//     return leagueError("Too many leagues created today. Try again tomorrow.");
//   }

//   const { name, region, adminEmail } = parsed.data;
//   const created = await createLeagueShell({ name, region });
//   if (!created.ok) {
//     logServerError("league.shell", created.error);
//     return leagueError(
//       created.error?.code === "P0001"
//         ? created.error.message
//         : "Could not create the league.",
//     );
//   }

//   let sent = "";
//   if (adminEmail) {
//     const res = await sendLeagueAdminInvitation({
//       leagueId: created.data,
//       leagueName: name,
//       email: adminEmail,
//       invitedByName: user.fullName ?? null,
//     });
//     sent = res.ok && res.emailSent ? "&sent=1" : "&sent=0";
//   }
//   revalidatePath("/admin/leagues");
//   redirect(`/admin/leagues/${created.data}?tab=admins&created=1${sent}`);
// }
