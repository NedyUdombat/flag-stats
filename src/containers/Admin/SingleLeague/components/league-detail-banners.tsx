import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

import type { LeagueDetailSearchParams } from "./league-detail.types";

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
  searchParams: LeagueDetailSearchParams;
  orphaned: boolean;
};

export function LeagueDetailBanners({ searchParams, orphaned }: Props) {
  return (
    <div className="space-y-2">
      {searchParams.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}
      {searchParams.created === "1" && (
        <Banner tone="ok">League created.</Banner>
      )}
      {searchParams.sent === "1" && (
        <Banner tone="ok">Claim invitation sent.</Banner>
      )}
      {searchParams.sent === "0" && (
        <Banner tone="warn">
          The league was created, but the email couldn&apos;t be sent. Invite
          again below.
        </Banner>
      )}
      {orphaned && (
        <Banner tone="warn">
          This league has no admin. Invite one from the Admins tab.
        </Banner>
      )}
      {searchParams.claimed === "1" && (
        <Banner tone="ok">
          You now manage this league. Use Edit to add its details.
        </Banner>
      )}
    </div>
  );
}
