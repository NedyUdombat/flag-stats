import {
  ArrowRightIcon,
  Building2Icon,
  CrownIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { ROLE_LABEL } from "@/features/account/account.service";
import type { Affiliation } from "@/features/shared/types";
import { Panel } from "../shared/panel";

interface AccountsRolesSectionProps {
  isPlatformAdmin: boolean;
  affiliations: Affiliation[];
}

const linkClass =
  "group/link inline-flex shrink-0 items-center gap-2 rounded-md border border-accent-gold/20 bg-accent-gold/[0.04] px-3 py-1.5 font-sans text-xs font-medium text-accent-gold transition-all duration-200 hover:border-accent-gold/40 hover:bg-accent-gold/[0.08]";

const roleIcon = (role: Affiliation["role"]) => {
  switch (role) {
    case "team_admin":
      return UsersIcon;
    case "league_admin":
      return TrophyIcon;
    case "federation_admin":
      return Building2Icon;
    default:
      return ShieldCheckIcon;
  }
};

export function AccountsRolesSection({
  isPlatformAdmin,
  affiliations,
}: AccountsRolesSectionProps) {
  const hasRoles = isPlatformAdmin || affiliations.length > 0;

  return (
    <Panel
      title="Your roles"
      description="Your access and responsibilities across the FlagStats platform."
    >
      <div className="space-y-4">
        {/* Intro */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-zs-muted">
            Roles are assigned when you create an entity or accept an
            invitation.
          </p>

          {hasRoles && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-accent-gold/20 bg-accent-gold/6 px-2.5 py-1 font-data text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
              {affiliations.length + (isPlatformAdmin ? 1 : 0)}{" "}
              {affiliations.length + (isPlatformAdmin ? 1 : 0) === 1
                ? "role"
                : "roles"}
            </span>
          )}
        </div>

        {/* Empty state */}
        {!hasRoles ? (
          <div className="flex items-start gap-4 rounded-lg border border-zs-line/50 bg-white/1 px-4 py-5 sm:px-5">
            <div className="mt-0.5 shrink-0 text-zs-muted/60">
              <ShieldCheckIcon className="size-5" strokeWidth={1.5} />
            </div>

            <div className="space-y-1">
              <h3 className="font-sans text-sm font-medium text-zs-ink">
                No roles assigned
              </h3>

              <p className="max-w-lg text-xs leading-5 text-zs-muted">
                You currently don't manage any teams, leagues or organizations.
                Your roles will appear here when you create an entity or accept
                an invitation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Platform Admin */}
            {isPlatformAdmin && (
              <div className="group relative overflow-hidden rounded-xl border border-accent-gold/20 bg-linear-to-r from-accent-gold/6 to-transparent p-4 transition-colors hover:border-accent-gold/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent-gold/20 bg-accent-gold/8 text-accent-gold">
                    <CrownIcon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-sm font-semibold text-zs-ink">
                        Platform Admin
                      </h3>

                      <span className="rounded-full border border-accent-gold/20 bg-accent-gold/6 px-2 py-0.5 font-data text-[9px] font-semibold uppercase tracking-wider text-accent-gold">
                        Elevated access
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zs-muted">
                      Full platform access and administration
                    </p>
                  </div>

                  <Link href="/admin" className={linkClass}>
                    Admin console
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Organization Affiliations */}
            {affiliations.map((a) => {
              const Icon = roleIcon(a.role);

              return (
                <div
                  key={`${a.role}-${a.manageHref}`}
                  className="group rounded-xl  bg-white/1.5 p-4 transition-all duration-200 hover:border-white/10 hover:bg-white/3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/3 text-zs-muted transition-colors group-hover:border-accent-gold/20 group-hover:bg-accent-gold/5 group-hover:text-accent-gold">
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-gold">
                        {ROLE_LABEL[a.role]}
                      </p>

                      <h3 className="mt-1 truncate font-sans text-sm font-semibold text-zs-ink">
                        {a.entityName}
                      </h3>
                    </div>

                    <Link href={a.manageHref} className={linkClass}>
                      Manage
                      <ArrowRightIcon className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}
