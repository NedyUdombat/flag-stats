"use server";

import { canCreateTeam } from "@/lib/permissions";
import { runCreate } from "../../entities/run-create";
import type { EntityActionState } from "../../entities/shared";
import { CreateTeamSchema, readCreateTeamForm } from "../team.schema";
import { createTeam } from "../team.service";

export async function createTeamAction(
  _prev: EntityActionState,
  fd: FormData,
): Promise<EntityActionState> {
  return runCreate({
    kind: "team",
    schema: CreateTeamSchema,
    raw: readCreateTeamForm(fd),
    allowed: canCreateTeam,
    create: createTeam,
  });
}
