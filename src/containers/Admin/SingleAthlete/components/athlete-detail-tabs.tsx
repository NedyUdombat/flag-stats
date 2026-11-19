import Link from "next/link";
import { cn } from "@/utils/cn";

import { ATHLETE_TABS, type AthleteTabId } from "./athlete-detail.constants";

type Props = {
  athleteId: string;
  activeTab: AthleteTabId;
};

export function AthleteDetailTabs({ athleteId, activeTab }: Props) {
  return (
    <nav
      aria-label="Athlete sections"
      className="flex overflow-x-auto border-b border-zs-line scrollbar-none"
    >
      {ATHLETE_TABS.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={`/admin/athletes/${athleteId}?tab=${tab.id}`}
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
