import { PlusIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import type { MyInvitation } from "@/features/invitations/invitation.types";
import { PendingInvitations } from "../invitations/pending-invitations";
import { Panel } from "../shared/panel";
import { buttonPrimary } from "../styles";

export function AthleteEmpty({
  createHref,
  invitations,
}: {
  createHref: string;
  invitations: MyInvitation[];
}) {
  return (
    <Panel
      title="No athlete profile yet"
      description="Your athlete profile is your public career record across teams, leagues, and countries. Create yours to build your sporting presence and make your stats discoverable."
    >
      <div className="space-y-6">
        <Link
          href={createHref}
          className={`${buttonPrimary} w-full sm:w-auto font-sans text-[14px] capitalize font-semibold rounded-sm cursor-pointer`}
        >
          <PlusIcon className="size-4" aria-hidden />
          Create athlete profile
        </Link>

        {invitations.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[.2em] text-slate-500">
                Incoming
              </p>
              <h3 className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-white">
                Pending invitations
              </h3>
            </div>

            <PendingInvitations invitations={invitations} />
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/2 p-4">
          <ShieldCheckIcon
            className="mt-0.5 size-4 shrink-0 text-slate-400"
            aria-hidden
          />

          <p className="text-xs leading-5 text-slate-400">
            If a team or league created a profile for you, your invitation will
            appear here once you sign in with the email address they used.
          </p>
        </div>
      </div>
    </Panel>
  );
}
