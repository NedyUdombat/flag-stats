import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { TeamMembershipsSection } from "@/containers/Admin/Teams/team-memberships-section";
import type { MyInvitation } from "@/features/invitations/invitation.types";
import type { Affiliation } from "@/features/shared/types";
import type { CurrentUser } from "@/types/users/types";
import { PendingInvitations } from "../invitations/pending-invitations";
import { Panel } from "../shared/panel";
import { AccountsRolesSection } from "./roles-section";

const CREATE_LINKS = [
  {
    href: "/account/create/team",
    label: "Create a team",
    body: "Run a roster and submit results. You become the team admin.",
  },
  {
    href: "/account/create/league",
    label: "Create a league",
    body: "Run tournaments and verify results. It starts unverified until FlagStats approves it.",
  },
  {
    href: "/account/create/organization",
    label: "Create an organization",
    body: "Link leagues under a federation. It starts unverified until FlagStats approves it.",
  },
];

export function TeamsTab({
  user,
  affiliations,
  invitations,
}: {
  user: CurrentUser;
  affiliations: Affiliation[];
  invitations: MyInvitation[];
}) {
  const isPlatformAdmin = user.platformRole === "super_admin";

  return (
    <div className="space-y-6">
      <AccountsRolesSection
        isPlatformAdmin={isPlatformAdmin}
        affiliations={affiliations}
      />

      <Panel
        title="Build your community"
        description="Start something of your own on FlagStats. Create a team, organize a league, or bring clubs and teams together under one organization. You'll be in charge, with the option to add other admins as you grow."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {CREATE_LINKS.map((c, index) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex flex-col overflow-hidden rounded-xl  bg-white/1.5 p-5 transition-all duration-200 hover:border-accent-gold/40 hover:bg-white/3"
            >
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-gold/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg border border-accent-gold/15 bg-accent-gold/6 text-accent-gold transition-colors group-hover:bg-accent-gold/10">
                  <PlusIcon className="size-5" aria-hidden />
                </div>

                <span className="font-data text-[10px] font-medium tracking-widest text-zs-muted/50">
                  0{index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="mt-5 flex-1 space-y-2">
                <h3 className="font-display text-base font-bold tracking-wide text-zs-ink uppercase">
                  {c.label}
                </h3>

                <p className="text-sm leading-6 text-zs-muted">{c.body}</p>
              </div>

              {/* Action */}
              <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4">
                <span className="font-sans text-xs font-medium text-accent-gold">
                  Get started
                </span>

                <ArrowRightIcon
                  className="size-4 text-accent-gold/70 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent-gold"
                  aria-hidden
                />
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <TeamMembershipsSection />

      <PendingInvitations invitations={invitations} />
    </div>
  );
}
