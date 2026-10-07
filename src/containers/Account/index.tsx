import Link from "next/link";
import {
  getMyAffiliations,
  getMyAthleteProfile,
  getRoleLabel,
} from "@/features/account/account.service";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import {
  SETTINGS_TABS,
  type SettingsMode,
  type SettingsTab,
} from "./account-tabs";
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

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <h1 className="font-display text-3xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          My Account
        </h1>
        <p className="mt-2 text-zs-muted">
          Your account, your athlete profile, and the teams, leagues and
          organisations you manage.
        </p>
      </header>

      <nav
        aria-label="Settings sections"
        className="flex overflow-x-auto border border-zs-line bg-zs-panel"
      >
        {SETTINGS_TABS.map((t) => (
          <Link
            key={t.id}
            href={`${basePath}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-r border-b-2 border-r-zs-line px-5 py-3 font-display text-base font-bold tracking-wider uppercase last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zs-lime",
              tab === t.id
                ? t.id === "delete"
                  ? "border-b-zs-coral bg-zs-coral/10 text-zs-coral"
                  : "border-b-zs-lime bg-zs-raised text-zs-lime"
                : cn(
                    "border-b-transparent hover:text-zs-ink",
                    t.id === "delete" ? "text-zs-coral/80" : "text-zs-muted",
                  ),
            )}
          >
            <t.icon className="size-4" aria-hidden />
            {t.label}
          </Link>
        ))}
      </nav>

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
        />
      )}
      {tab === "teams" && <TeamsTab user={user} affiliations={affiliations} />}
      {tab === "security" && <PasswordForm />}
      {tab === "delete" &&
        (user.email ? (
          <DeleteAccountForm
            email={user.email}
            athleteName={athlete?.athlete.full_name ?? null}
          />
        ) : (
          <p className="border border-zs-line bg-zs-panel p-5 text-sm text-zs-muted">
            Your account has no email address, so it can&apos;t be deleted here.
            Contact support.
          </p>
        ))}
    </div>
  );
}
