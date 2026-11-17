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
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="relative border-b border-white/10 pb-5 sm:pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="wrap-break-word font-sans text-3xl font-black uppercase leading-[.98] tracking-[-.06em] text-white sm:text-4xl lg:text-5xl">
              {copy.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              {copy.description}
            </p>
          </div>

          {user.createdAt && (
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-md border border-accent-gold/20 bg-accent-gold/10 px-3 py-2">
              <CircleDashedCheck
                size={14}
                className="shrink-0 text-accent-gold"
              />

              <p className="text-[9px] font-medium uppercase tracking-[.12em] text-white sm:text-[10px]">
                Member since: {format(new Date(user.createdAt), "MMM yyyy")}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Settings layout */}
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">
        <AccountsNavTab basePath={basePath} tab={tab} />

        <section className="min-w-0 space-y-5 sm:space-y-6">
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
              <p className="rounded-xl border border-white/10 bg-neutral-covert p-4 text-sm leading-6 text-slate-400 sm:p-5">
                Your account has no email address, so it can't be deleted here.
                Contact support.
              </p>
            ))}
        </section>
      </div>
    </div>
  );
}
