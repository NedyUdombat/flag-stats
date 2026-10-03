import {
  ArrowRightIcon,
  ExternalLinkIcon,
  LockIcon,
  PlusIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import {
  getMyAffiliations,
  getMyAthleteDetail,
  ROLE_LABEL,
} from "@/features/account/service";
// import {
//   getMyAffiliations,
//   getMyAthleteDetail,
//   ROLE_LABEL,
// } from "@/features/account/services/account.service";
import { initials } from "@/lib/display";
// import { initials } from "@/features/users/lib/display";
import type { CurrentUser } from "@/types/users/types";
// import type { CurrentUser } from "@/features/users/services/current-user";
import { cn } from "@/utils/cn";
import {
  DeleteAccountForm,
  EmailForm,
  PasswordForm,
  ProfileForm,
} from "./admin-settings-forms";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Password & security", icon: LockIcon },
  { id: "delete", label: "Delete account", icon: TriangleAlertIcon },
] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export function parseSettingsTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.some((t) => t.id === value)
    ? (value as SettingsTab)
    : "profile";
}

/**
 * The settings screen, shared by /admin/settings (inside the admin console)
 * and /account/settings (athletes and anyone else signed in). `basePath`
 * keeps the tab links on whichever route rendered it.
 */
export async function SettingsView({
  user,
  tab,
  basePath,
  breadcrumb,
}: {
  user: CurrentUser;
  tab: SettingsTab;
  basePath: string;
  breadcrumb: { label: string; href: string };
}) {
  const [affiliations, athlete] =
    tab === "profile"
      ? await Promise.all([
          getMyAffiliations(user),
          getMyAthleteDetail(user.id).catch(() => null),
        ])
      : [[], null];

  const primaryRole = user.roles[0]?.role;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href={breadcrumb.href} className="hover:text-zs-ink">
            {breadcrumb.label}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Settings</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          Settings
        </h1>
        <p className="mt-2 text-zs-muted">
          Your profile, sign-in details and account.
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
        <div className="space-y-6">
          <section className="flex flex-wrap items-center gap-4 border border-zs-line bg-zs-panel p-5">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="size-20 object-cover"
              />
            ) : (
              <span className="grid size-20 place-items-center bg-zs-raised font-display text-3xl font-bold text-zs-lime">
                {initials(user.fullName, user.email)}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-display text-3xl leading-none font-bold tracking-wide text-zs-ink uppercase">
                {user.fullName ?? "Name not set"}
              </p>
              <p className="mt-1 text-zs-muted">
                {primaryRole ? ROLE_LABEL[primaryRole] : "Member"}
                {user.email && (
                  <span className="font-data text-xs"> · {user.email}</span>
                )}
              </p>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <ProfileForm
                fullName={user.fullName}
                avatarUrl={user.avatarUrl}
              />
              <EmailForm email={user.email} />
            </div>

            <div className="space-y-6 self-start">
              {athlete && (
                <section className="border border-zs-line bg-zs-panel p-5">
                  <h2 className="font-display text-xl font-bold tracking-wide text-zs-ink uppercase">
                    Your athlete profile
                  </h2>
                  <p className="mt-1 text-sm text-zs-muted">
                    Your name and verification on it are managed by your team or
                    league.
                  </p>
                  <div className="mt-4 border border-zs-line px-3 py-3">
                    <p className="font-display text-lg font-bold text-zs-ink uppercase">
                      {athlete.athlete.full_name}
                    </p>
                    <p className="font-data text-xs text-zs-muted">
                      {athlete.careerTotals.gamesPlayed} verified games ·{" "}
                      {athlete.careerTotals.touchdowns} TD
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1 font-display text-sm font-bold tracking-wider text-zs-lime uppercase hover:underline"
                    >
                      Edit bio{" "}
                      <ArrowRightIcon className="size-3.5" aria-hidden />
                    </Link>
                    <a
                      href={`${siteUrl}/athletes/${athlete.athlete.slug}`}
                      className="inline-flex items-center gap-1 font-display text-sm font-bold tracking-wider text-zs-muted uppercase hover:text-zs-ink"
                    >
                      Public profile{" "}
                      <ExternalLinkIcon className="size-3.5" aria-hidden />
                    </a>
                  </div>
                </section>
              )}

              {affiliations.length > 0 && (
                <section className="border border-zs-line bg-zs-panel p-5">
                  <h2 className="font-display text-xl font-bold tracking-wide text-zs-ink uppercase">
                    Your roles
                  </h2>
                  <p className="mt-1 text-sm text-zs-muted">
                    Granted by a platform admin; you can&apos;t change these
                    here.
                  </p>
                  <ul className="mt-4 divide-y divide-zs-line border border-zs-line">
                    {affiliations.map((a, i) => (
                      <li
                        key={`${a.role}-${a.entitySlugOrId ?? "unscoped"}-${i}`}
                        className="px-3 py-3"
                      >
                        <p className="font-data text-[11px] text-zs-lime uppercase">
                          {ROLE_LABEL[a.role]}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between gap-3">
                          <span
                            className={cn(
                              "text-sm",
                              a.entityName ? "text-zs-ink" : "text-zs-muted",
                            )}
                          >
                            {a.entityName ?? "Not set up yet"}
                          </span>
                          {a.manageHref && (
                            <Link
                              href={a.manageHref}
                              className="inline-flex shrink-0 items-center gap-1 font-display text-sm font-bold tracking-wider text-zs-lime uppercase hover:underline"
                            >
                              {a.entityName ? (
                                <>
                                  Manage{" "}
                                  <ArrowRightIcon
                                    className="size-3.5"
                                    aria-hidden
                                  />
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="size-3.5" aria-hidden />{" "}
                                  Create
                                </>
                              )}
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "security" && <PasswordForm />}

      {tab === "delete" &&
        (user.email ? (
          <DeleteAccountForm email={user.email} />
        ) : (
          <p className="border border-zs-line bg-zs-panel p-5 text-sm text-zs-muted">
            Your account has no email address, so it can&apos;t be deleted here.
            Contact support.
          </p>
        ))}
    </div>
  );
}
