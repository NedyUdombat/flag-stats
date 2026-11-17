import Link from "next/link";
import { cn } from "@/utils/cn";
import { SETTINGS_TABS, type SettingsTab } from "./account-tabs";

interface AccountsNavTabProps {
  basePath: string;
  tab: SettingsTab;
}

export function AccountsNavTab({ basePath, tab }: AccountsNavTabProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="grid grid-cols-2 gap-3 rounded-lg  border  p-2 sm:grid-cols-3 lg:flex lg:flex-col"
    >
      {SETTINGS_TABS.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}?tab=${t.id}`}
          aria-current={tab === t.id ? "page" : undefined}
          className={cn(
            "group flex min-h-12 items-center gap-3 rounded-lg border border-transparent p-2 font-sans text-xs  tracking-[.06em] transition-colors sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold",
            tab === t.id
              ? "border-accent-gold/20 bg-accent-gold/10 text-accent-gold"
              : t.id === "delete"
                ? "text-destructive/70 hover:bg-white/5 hover:text-destructive"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-md",
              tab === t.id
                ? "bg-accent-gold/15"
                : "bg-white/4 group-hover:bg-white/8",
            )}
          >
            <t.icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
