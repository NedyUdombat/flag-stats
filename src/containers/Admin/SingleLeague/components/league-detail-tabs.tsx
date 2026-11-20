import Link from "next/link";
import { cn } from "@/utils/cn";

import { LEAGUE_TABS, type LeagueTabId } from "./league-detail.constants";

type Props = {
  leagueId: string;
  activeTab: LeagueTabId;
};

export function LeagueDetailTabs({ leagueId, activeTab }: Props) {
  return (
    <nav
      aria-label="League sections"
      className="flex overflow-x-auto border-b border-zs-line scrollbar-none"
    >
      {LEAGUE_TABS.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={`/admin/leagues/${leagueId}?tab=${tab.id}`}
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
