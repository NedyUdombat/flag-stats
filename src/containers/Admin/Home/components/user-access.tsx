import { KeyRound } from "lucide-react";

import type { getCurrentUser } from "@/features/users/user.service";
import type { DashboardScope } from "../types";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

const cardStyle = "rounded-xl border border-[#272B35] bg-[#11141B] shadow-sm";

function roleLabel(role: unknown) {
  return String(role ?? "Administrator")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function UserAccess({
  user,
  scope,
}: {
  user: CurrentUser;
  scope: DashboardScope;
}) {
  return (
    <section className={`${cardStyle} p-5`}>
      <div className="mb-4 flex items-center gap-2">
        <KeyRound size={18} className="text-[#FACC15]" />

        <h2 className="font-semibold text-white">Your access</h2>
      </div>

      {user.roles.length === 0 ? (
        <p className="text-sm text-slate-400">
          You don't hold an admin role yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {user.roles.map((role, index) => (
            <li
              key={`${role.role}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#303643] bg-[#171B24] px-3 py-3"
            >
              <span className="text-sm font-medium text-slate-200">
                {roleLabel(role.role)}
              </span>

              <span className="text-xs text-slate-400">
                {role.teamId
                  ? "Team"
                  : role.leagueId
                    ? "League"
                    : role.organizationId
                      ? "Federation"
                      : "All"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* 
      <p className="mt-4 text-xs leading-5 text-slate-400">
        {scope === "platform"
          ? "You're seeing activity across the whole platform."
          : `Fixtures, results and verification counts are limited to the ${scope} scope covered by your role.`}
      </p> */}
    </section>
  );
}
