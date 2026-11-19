import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { CurrentUser } from "@/types/users/types";
import type { DashboardScope } from "../types";

const cardStyle = "rounded-xl border border-[#272B35] bg-[#11141B] shadow-sm";

export function QuickActions({
  scope,
  userCanVerify,
  user,
}: {
  scope: DashboardScope;
  userCanVerify: boolean;
  user: CurrentUser;
}) {
  const actions = [
    ...(userCanVerify
      ? [
          {
            label: "Review verification queue",
            href: "/admin/verifications",
            icon: ClipboardCheck,
          },
        ]
      : []),

    {
      label: scope === "team" ? "Manage roster" : "Schedule a fixture",
      href: scope === "team" ? "/admin/teams" : "/admin/fixtures",
      icon: CalendarClock,
    },

    {
      label: "View competitions",
      href: "/admin/competitions",
      icon: Trophy,
    },

    {
      label: "View statistics",
      href: "/admin/statistics",
      icon: Activity,
    },
  ];

  return (
    <section className={`${cardStyle} p-5`}>
      <h2 className="mb-4 font-semibold text-white">Quick actions</h2>

      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                index === 0 && userCanVerify
                  ? "border-[#806B15] bg-[#30280F] text-[#FACC15] hover:bg-[#3B3010]"
                  : "border-[#303643] bg-[#171B24] text-slate-300 hover:border-[#50596B] hover:bg-[#202633]"
              }`}
            >
              <Icon size={17} />

              <span className="flex-1">{action.label}</span>

              <ArrowRight size={14} className="text-slate-500" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
