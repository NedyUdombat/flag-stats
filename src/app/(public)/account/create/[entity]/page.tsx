import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/containers/Account/account-shell";
import { CreateEntityForm } from "@/containers/CreateEntity/create-entity-form";
import {
  ENTITY_CONFIG,
  type EntityKind,
} from "@/containers/CreateEntity/entity-config";
import { createLeagueAction } from "@/features/leagues/actions/league.actions";
import { createOrganizationAction } from "@/features/organizations/actions/organization.actions";
import { createTeamAction } from "@/features/teams/actions/team.actions";
import { getCurrentUser } from "@/features/users/user.service";
import {
  canCreateLeague,
  canCreateOrganization,
  canCreateTeam,
} from "@/lib/permissions";

const ACTIONS = {
  team: createTeamAction,
  league: createLeagueAction,
  organization: createOrganizationAction,
};

export const metadata = { title: "Create" };

export default async function CreateEntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;
  if (!(entity in ENTITY_CONFIG)) notFound();
  const kind = entity as EntityKind;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/account/create/${kind}`);

  const allowed = {
    team: canCreateTeam,
    league: canCreateLeague,
    organization: canCreateOrganization,
  }[kind](user);
  if (!allowed) redirect("/account?tab=teams");

  return (
    <AccountShell>
      <CreateEntityForm kind={kind} action={ACTIONS[kind]} />
    </AccountShell>
  );
}
