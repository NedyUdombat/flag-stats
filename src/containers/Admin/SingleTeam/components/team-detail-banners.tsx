import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

import type { TeamDetailSearchParams } from "./team-detail.types";

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: ReactNode;
}) {
  const Icon = tone === "ok" ? CircleCheckIcon : TriangleAlertIcon;

  return (
    <p
      role={tone === "ok" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 px-4 py-3 text-sm rounded-md",
        "font-data leading-relaxed",
        tone === "ok"
          ? "bg-green-800/90 text-zs-ink"
          : "bg-accent-gold/10 text-zs-ink",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "ok" ? "text-green-300" : "text-accent-gold",
        )}
        aria-hidden
      />

      <span>{children}</span>
    </p>
  );
}

type Props = {
  search: TeamDetailSearchParams;
  orphaned: boolean;
};

export function TeamDetailBanners({ search, orphaned }: Props) {
  return (
    <div className="space-y-2">
      {search.created === "1" && <Banner tone="ok">Team created.</Banner>}

      {search.sent === "1" && <Banner tone="ok">Claim invitation sent.</Banner>}

      {search.sent === "0" && (
        <Banner tone="warn">
          The team was created, but the email couldn't be sent. Invite again
          below.
        </Banner>
      )}

      {orphaned && (
        <Banner tone="warn">
          This team has no admin. Invite one from the Admins tab.
        </Banner>
      )}

      {search.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}

      {search.claimed === "1" && (
        <Banner tone="ok">
          You now manage this team. Use Edit to add its details.
        </Banner>
      )}

      {search.added === "1" && (
        <Banner tone="ok">
          Athlete created, added to the team and invited.
        </Banner>
      )}

      {search.added === "0" && (
        <Banner tone="warn">
          Athlete created and added, but the invitation email couldn't be sent.
          Resend it from the athlete's page.
        </Banner>
      )}
    </div>
  );
}
