"use server";

import { canCreateLeague } from "@/lib/permissions";
import { runCreate } from "../../entities/run-create";
import type { EntityActionState } from "../../entities/shared";
import { CreateLeagueSchema, readCreateLeagueForm } from "../league.schema";
import { createLeague } from "../league.service";

export async function createLeagueAction(
  _prev: EntityActionState,
  fd: FormData,
): Promise<EntityActionState> {
  return runCreate({
    kind: "league",
    schema: CreateLeagueSchema,
    raw: readCreateLeagueForm(fd),
    allowed: (user) => canCreateLeague(user),
    create: createLeague,
  });
}
