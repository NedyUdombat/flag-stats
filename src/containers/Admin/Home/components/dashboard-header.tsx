import { Shield } from "lucide-react";
import type { getCurrentUser } from "@/features/users/user.service";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

function roleLabel(role: unknown) {
  return String(role ?? "Administrator")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DashboardHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#292E38] bg-[#151922] px-3 py-1 text-xs font-semibold text-slate-300">
        <Shield size={14} className="text-[#FACC15]" />

        {roleLabel(user.roles?.[0]?.role)}
      </div>

      <span className="text-xs text-slate-500">Preview using dummy data</span>
    </header>
  );
}
