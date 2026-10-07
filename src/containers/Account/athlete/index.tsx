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
}: {
  profile: MyAthleteProfile | null;
  defaultName: string | null;
  mode: SettingsMode;
  basePath: string;
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
      <AthleteEmpty createHref={`${viewHref}&mode=create`} />
    );
  }

  if (mode === "edit") {
    return (
      <AthleteForm
        mode="edit"
        initial={toFormInitial(profile.athlete, profile.contactPhone)}
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
  // return <AthleteView profile={profile} editHref={`${viewHref}&mode=edit`} />;
}
