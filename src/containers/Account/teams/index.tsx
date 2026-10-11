import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { ROLE_LABEL } from "@/features/account/account.service";
import type { MyInvitation } from "@/features/invitations/invitation.types";
import type { Affiliation } from "@/features/shared/types";
import type { CurrentUser } from "@/types/users/types";
import { PendingInvitations } from "../invitations/pending-invitations";
import { Panel } from "../shared/panel";

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
    label: "Create an organisation",
    body: "Link leagues under a federation. It starts unverified until FlagStats approves it.",
  },
];

const linkClass =
  "inline-flex shrink-0 items-center gap-1 font-display text-sm font-bold tracking-wider text-zs-lime uppercase hover:underline";

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
      <Panel
        title="Your roles"
        description="You get a role by creating a team, league or organisation, or by accepting an invitation."
      >
        {!isPlatformAdmin && affiliations.length === 0 ? (
          <p className="text-sm text-zs-muted">
            You don&apos;t manage a team, league or organisation yet.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {isPlatformAdmin && (
              <li className="px-3 py-3">
                <p className="font-data text-[11px] text-zs-lime uppercase">
                  Platform admin
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-zs-ink">
                    Full platform access
                  </span>
                  <Link href="/admin" className={linkClass}>
                    Open admin console{" "}
                    <ArrowRightIcon className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            )}
            {affiliations.map((a) => (
              <li key={`${a.role}-${a.manageHref}`} className="px-3 py-3">
                <p className="font-data text-[11px] text-zs-lime uppercase">
                  {ROLE_LABEL[a.role]}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-zs-ink">{a.entityName}</span>
                  <Link href={a.manageHref} className={linkClass}>
                    Manage <ArrowRightIcon className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Create new"
        description="Anyone can create one. You become its admin and can add other admins later."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {CREATE_LINKS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block border border-zs-line p-4 hover:border-zs-lime"
            >
              <p className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
                <PlusIcon className="size-4 text-zs-lime" aria-hidden />
                {c.label}
              </p>
              <p className="mt-1 text-sm text-zs-muted">{c.body}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <PendingInvitations invitations={invitations} />
    </div>
  );
}
