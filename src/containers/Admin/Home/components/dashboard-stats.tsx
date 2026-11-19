import { CalendarClock, ClipboardCheck, Shield, Users } from "lucide-react";

import type { DashboardStats as Stats } from "../types";

export function DashboardStats({ stats }: { stats: Stats }) {
  const statItems = [
    {
      key: "pending",
      label: "Pending approvals",
      value: stats.pending,
      description: "Results and player stats awaiting sign-off",
      footer: stats.pending > 0 ? "Awaiting review" : "Queue is clear",
      icon: ClipboardCheck,
      attention: true,
      iconClass: "bg-orange-400/10 text-orange-400",
    },
    {
      key: "athletes",
      label: "Athletes",
      value: stats.athletes,
      description: "Registered within your access scope",
      footer: "Registered athletes",
      icon: Users,
      attention: false,
      iconClass: "bg-amber-400/10 text-amber-400",
    },
    {
      key: "teams",
      label: "Teams & clubs",
      value: stats.teams,
      description: `Across ${stats.leagues} ${
        stats.leagues === 1 ? "league" : "leagues"
      }`,
      footer: "Registered teams",
      icon: Shield,
      attention: false,
      iconClass: "bg-sky-400/10 text-sky-400",
    },
    {
      key: "fixtures",
      label: "Upcoming fixtures",
      value: stats.fixtures,
      description: "Scheduled from today onward",
      footer: `${stats.verified} verified results`,
      icon: CalendarClock,
      attention: false,
      iconClass: "bg-emerald-400/10 text-emerald-400",
    },
  ];

  return (
    <section aria-label="Dashboard overview statistics">
      <div className="grid grid-cols-4 divide-x divide-zs-line rounded-md bg-[#1C212B] py-3 sm:hidden">
        {statItems.map((stat) => {
          const hasAttention = stat.attention && stat.value > 0;

          return (
            <div
              key={stat.key}
              className="flex min-w-0 flex-col items-center justify-center px-1"
            >
              <span
                className={`text-lg font-semibold leading-none tracking-tight tabular-nums ${
                  hasAttention ? "text-orange-400" : "text-zs-ink"
                }`}
              >
                {stat.value.toLocaleString()}
              </span>

              <span className="mt-1.5 w-full truncate text-center text-[9px] font-medium text-zs-muted">
                {stat.label === "Pending approvals"
                  ? "Pending"
                  : stat.label === "Upcoming fixtures"
                    ? "Fixtures"
                    : stat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tablet and desktop: Full statistic cards */}
      <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          const hasAttention = stat.attention && stat.value > 0;

          return (
            <article
              key={stat.key}
              className="
                group relative min-w-0 overflow-hidden
                rounded-md border border-zs-line
                bg-transparent p-4
                transition-colors duration-200
                hover:border-white/15 hover:bg-[#1a202c]
                sm:p-5
              "
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zs-muted">
                  {stat.label}
                </p>

                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    hasAttention
                      ? "bg-orange-400/10 text-orange-400"
                      : stat.iconClass
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </div>

              <p
                className={`mt-5 text-3xl font-semibold leading-none tracking-tight tabular-nums sm:text-4xl ${
                  hasAttention ? "text-orange-400" : "text-zs-ink"
                }`}
              >
                {stat.value.toLocaleString()}
              </p>

              <p className="mt-2 min-h-5 text-xs leading-relaxed text-zs-muted">
                {stat.description}
              </p>

              <div className="mt-4 border-t border-white/5 pt-3">
                <p
                  className={`text-[11px] font-medium ${
                    hasAttention ? "text-orange-400/80" : "text-zs-muted"
                  }`}
                >
                  {stat.footer}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
