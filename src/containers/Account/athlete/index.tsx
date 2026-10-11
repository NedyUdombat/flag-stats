import type { MyInvitation } from "@/features/invitations/invitation.types";
import type { MyAthleteProfile } from "@/features/shared/types";
import type { SettingsMode } from "../account-tabs";
import { emptyInitial, toFormInitial } from "./athlete-default";
import { AthleteEmpty } from "./athlete-empty";
import { AthleteForm } from "./athlete-form";
import { AthleteView } from "./athlete-view";

export function AthleteTab({
  profile,
  defaultName,
  mode,
  basePath,
  invitations,
}: {
  profile: MyAthleteProfile | null;
  defaultName: string | null;
  mode: SettingsMode;
  basePath: string;
  invitations: MyInvitation[];
}) {
  const viewHref = `${basePath}?tab=athlete`;

  if (!profile) {
    return mode === "create" ? (
      <AthleteForm
        mode="create"
        initial={emptyInitial(defaultName)}
        viewHref={viewHref}
      />
    ) : (
      <AthleteEmpty
        createHref={`${viewHref}&mode=create`}
        invitations={invitations.filter((i) => i.type === "athlete_claim")}
      />
    );
  }

  if (mode === "edit") {
    return (
      <AthleteForm
        mode="edit"
        initial={toFormInitial(profile.athlete, {
          phone: profile.contactPhone,
          email: profile.contactEmail,
        })}
        viewHref={viewHref}
      />
    );
  }

  return (
    <AthleteView
      profile={profile}
      editHref={`${viewHref}&mode=edit`}
      viewHref={viewHref}
    />
  );
}
