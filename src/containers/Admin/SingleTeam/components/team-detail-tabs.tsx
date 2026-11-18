import Link from "next/link";
import { cn } from "@/utils/cn";

import { TEAM_TABS, type TeamTabId } from "./team-detail.constants";

type Props = {
  teamId: string;
  activeTab: TeamTabId;
};

export function TeamDetailTabs({ teamId, activeTab }: Props) {
  return (
    <nav
      aria-label="Team sections"
      className="flex overflow-x-auto border-b border-zs-line scrollbar-none"
    >
      {TEAM_TABS.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={`/admin/teams/${teamId}?tab=${tab.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px flex shrink-0 items-center border-b-2 px-5 py-4",
              "font-sans text-sm font-medium uppercase tracking-wider",
              "transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-gold",
              active
                ? "border-b-accent-gold text-accent-gold"
                : "border-b-transparent text-zs-muted hover:text-accent-gold",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
