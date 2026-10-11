import { PlusIcon } from "lucide-react";
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
      description="Your athlete profile is your public career record across teams, leagues and countries."
    >
      <div className="space-y-4">
        <p className="max-w-2xl text-sm text-zs-muted">
          If a team or league created a profile for you, you'll find the
          invitation here once you sign in with the email they used.
        </p>

        {invitations.length > 0 ? (
          <PendingInvitations invitations={invitations} />
        ) : null}
        <Link href={createHref} className={buttonPrimary}>
          <PlusIcon className="size-4" aria-hidden />
          Create athlete profile
        </Link>
      </div>
    </Panel>
  );
}
