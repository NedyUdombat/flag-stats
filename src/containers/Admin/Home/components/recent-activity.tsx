import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

import type { DashboardActivity } from "../types";

export function RecentActivity({
  activities,
}: {
  activities: DashboardActivity[];
}) {
  return (
    <section className="rounded-xl border border-[#272B35] bg-[#11141B] p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">Recent activity</h2>

        <Link
          href="/admin/activity"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-[#FACC15]"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      <ul className="space-y-4">
        {activities.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#343B49] bg-[#1C222D] text-[#FACC15]">
              <Activity size={15} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200">{item.title}</p>

              <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
            </div>

            <span className="whitespace-nowrap text-xs text-slate-500">
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
