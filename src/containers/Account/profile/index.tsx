import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { initials } from "@/lib/display";
import type { CurrentUser } from "@/types/users/types";
import type { SettingsMode } from "../account-tabs";
import { buttonSecondary } from "../styles";
import { ProfileForm } from "./profile-form";

export function ProfileTab({
  user,
  mode,
  basePath,
  roleLabel,
}: {
  user: CurrentUser;
  mode: SettingsMode;
  basePath: string;
  roleLabel: string;
}) {
  const viewHref = `${basePath}?tab=profile`;
  const editing = mode === "edit";

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 border border-zs-line bg-zs-panel p-5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-20 object-cover" />
        ) : (
          <span className="grid size-20 place-items-center bg-zs-raised font-display text-3xl font-bold text-zs-lime">
            {initials(user.fullName, user.email)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            {user.fullName ?? "Name not set"}
          </p>
          <p className="mt-1 text-zs-muted">
            {roleLabel}
            {user.email && (
              <span className="font-data text-xs"> · {user.email}</span>
            )}
          </p>
        </div>
        <Link
          href={editing ? viewHref : `${viewHref}&mode=edit`}
          className={buttonSecondary}
        >
          {!editing && <PencilIcon className="size-4" aria-hidden />}
          {editing ? "Cancel" : "Edit profile"}
        </Link>
      </section>

      {editing ? (
        <ProfileForm
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
          viewHref={viewHref}
        />
      ) : (
        <p className="text-sm text-zs-muted">
          This is your account profile. Your sports details live in the Athlete
          tab, and the teams, leagues and organisations you manage are in Teams
          &amp; organisations.
        </p>
      )}
    </div>
  );
}
