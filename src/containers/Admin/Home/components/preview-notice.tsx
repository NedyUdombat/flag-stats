import { CheckCircle2 } from "lucide-react";

export function DashboardPreviewNotice() {
  return (
    <section className="rounded-xl border border-[#343B49] bg-[#171B24] p-4">
      <div className="flex items-center gap-2 text-white">
        <CheckCircle2 size={16} className="text-[#FACC15]" />

        <p className="text-xs font-semibold">Development preview</p>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        Dashboard figures, matches and activity are sample data. Replace them
        with the dashboard service when ready.
      </p>
    </section>
  );
}
