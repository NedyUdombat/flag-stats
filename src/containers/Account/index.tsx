import { format } from "date-fns";
import { CircleDashedCheck } from "lucide-react";
import {
  getMyAffiliations,
  getMyAthleteProfile,
  getRoleLabel,
} from "@/features/account/account.service";
import { getMyPendingInvitations } from "@/features/invitations/invitation.service";
import type { CurrentUser } from "@/types/users/types";
import {
  type SettingsMode,
  type SettingsTab,
  sectionCopy,
} from "./account-tabs";
import { AccountsNavTab } from "./accounts-nav-tab";
import { AthleteTab } from "./athlete";
import { DeleteAccountForm } from "./delete-account";
import { ProfileTab } from "./profile";
import { PasswordForm } from "./security/password-form";
import { TeamsTab } from "./teams";

export async function AccountView({
  user,
  tab,
  mode,
  basePath,
}: {
  user: CurrentUser;
  tab: SettingsTab;
  mode: SettingsMode;
  basePath: string;
}) {
  const athlete =
    tab === "athlete" || tab === "delete"
      ? await getMyAthleteProfile(user.id)
      : null;
  const affiliations = tab === "teams" ? await getMyAffiliations(user) : [];
  const invitations =
    tab === "teams" || tab === "athlete" ? await getMyPendingInvitations() : [];

  const copy = sectionCopy[tab];

  return (
    <div className="space-y-8">
      <header className="relative border-b border-white/10 pb-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-sans text-3xl font-black uppercase leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              {copy.description}
            </p>
          </div>
          {user.createdAt && (
            <div className="border rounded-sm p-2 flex items-center gap-2 bg-accent-gold/10 text-accent-gold">
              <CircleDashedCheck size={14} />
              <p className="text-[8px] uppercase tracking-[.14em] text-white">
                Member since: {format(new Date(user?.createdAt), "MMM yyyy")}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        <AccountsNavTab basePath={basePath} tab={tab} />

        <section className="min-w-0 space-y-5">
          {tab === "profile" && (
            <ProfileTab
              user={user}
              mode={mode}
              basePath={basePath}
              roleLabel={getRoleLabel(user)}
            />
          )}
          {tab === "athlete" && (
            <AthleteTab
              profile={athlete}
              defaultName={user.fullName}
              mode={mode}
              basePath={basePath}
              invitations={invitations}
              user={user}
            />
          )}
          {tab === "teams" && (
            <TeamsTab
              user={user}
              affiliations={affiliations}
              invitations={invitations}
            />
          )}
          {tab === "security" && <PasswordForm />}
          {tab === "delete" &&
            (user.email ? (
              <DeleteAccountForm
                email={user.email}
                athleteName={athlete?.athlete.full_name ?? null}
              />
            ) : (
              <p className="rounded-xl border border-white/10 bg-neutral-covert p-5 text-sm text-slate-400">
                Your account has no email address, so it can&apos;t be deleted
                here. Contact support.
              </p>
            ))}
        </section>
      </div>
    </div>
  );
}
