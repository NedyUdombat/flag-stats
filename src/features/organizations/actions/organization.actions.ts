"use server";

import { canCreateOrganization } from "@/lib/permissions";
import { runCreate } from "../../entities/run-create";
import type { EntityActionState } from "../../entities/shared";
import {
  CreateOrganizationSchema,
  readCreateOrganizationForm,
} from "../organization.schema";
import { createOrganization } from "../organization.service";

export async function createOrganizationAction(
  _prev: EntityActionState,
  fd: FormData,
): Promise<EntityActionState> {
  return runCreate({
    kind: "organization",
    schema: CreateOrganizationSchema,
    raw: readCreateOrganizationForm(fd),
    allowed: canCreateOrganization,
    create: createOrganization,
  });
}
