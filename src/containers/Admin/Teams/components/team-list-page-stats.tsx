import {
  Activity,
  type LucideIcon,
  ShieldAlert,
  Trash2,
  UserRoundX,
  Users,
} from "lucide-react";
import type { TeamListStatus } from "@/features/teams/team.constants";
import type { AdminTeamsStatsObject } from "@/features/teams/team.types";

interface TeamListPageStatsProps {
  stats: AdminTeamsStatsObject;
}

const STAT_CONFIG: Record<
  TeamListStatus,
  {
    label: string;
    icon: LucideIcon;
    iconClass: string;
    attention?: boolean;
  }
> = {
  active: {
    label: "Active teams",
    icon: Activity,
    iconClass: "text-amber-400 bg-amber-400/10",
  },
  unverified: {
    label: "Unverified",
    icon: ShieldAlert,
    iconClass: "text-orange-400 bg-orange-400/10",
    attention: true,
  },
  orphaned: {
    label: "Orphaned",
    icon: UserRoundX,
    iconClass: "text-orange-400 bg-orange-400/10",
    attention: true,
  },
  unclaimed: {
    label: "Unclaimed",
    icon: Users,
    iconClass: "text-yellow-400 bg-yellow-400/10",
    attention: true,
  },
  deleted: {
    label: "Deleted",
    icon: Trash2,
    iconClass: "text-zs-muted bg-white/5",
  },
};

export function TeamListPageStats({ stats }: TeamListPageStatsProps) {
  return (
    <section aria-label="Team overview statistics">
      {/* Mobile: Compact horizontal overview */}
      <div
        className="
        grid grid-cols-5 divide-x divide-zs-line
        rounded-md
        bg-[#171c27] py-3 sm:hidden
      "
      >
        {stats.map((stat) => {
          const config = STAT_CONFIG[stat.s];
          const hasAttention = config.attention && stat.value > 0;

          return (
            <div
              key={stat.s}
              className="flex min-w-0 flex-col items-center justify-center px-1"
            >
              <span
                className={`text-lg font-semibold leading-none tracking-tight tabular-nums ${
                  hasAttention
                    ? "text-orange-400"
                    : stat.s === "active"
                      ? "text-amber-400"
                      : "text-zs-ink"
                }`}
              >
                {stat.value.toLocaleString()}
              </span>

              <span
                className="
                mt-1.5 w-full truncate text-center
                text-[9px] font-medium text-zs-muted
              "
              >
                {config.label.replace(" teams", "")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tablet and desktop: Full statistic cards */}
      <div
        className="
        hidden grid-cols-2 gap-3
        sm:grid xl:grid-cols-5
      "
      >
        {stats.map((stat) => {
          const config = STAT_CONFIG[stat.s];
          const Icon = config.icon;
          const hasAttention = config.attention && stat.value > 0;

          const iconClass = hasAttention
            ? config.iconClass
            : config.attention
              ? "text-zs-muted bg-white/5"
              : config.iconClass;

          return (
            <article
              key={stat.s}
              className="
                group relative min-w-0 overflow-hidden
                rounded-md border border-transparent
                bg-[#171c27] p-4
                transition-colors duration-200
                hover:border hover:border-white/15 hover:bg-[#1a202c]
                sm:p-5
              "
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zs-muted">
                  {config.label}
                </p>

                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </div>

              <p className="mt-5 text-3xl font-semibold leading-none tracking-tight text-zs-ink tabular-nums sm:text-4xl">
                {stat.value.toLocaleString()}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
