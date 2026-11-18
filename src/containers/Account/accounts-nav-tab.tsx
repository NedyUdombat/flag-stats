"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { SETTINGS_TABS, type SettingsTab } from "./account-tabs";

interface AccountsNavTabProps {
  basePath: string;
  tab: SettingsTab;
}

export function AccountsNavTab({ basePath, tab }: AccountsNavTabProps) {
  return (
    <>
      {/* Mobile navigation */}
      <div className="lg:hidden -mx-4 sm:mx-0">
        <nav
          aria-label="Settings sections"
          className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-0 scrollbar-none snap-x snap-mandatory"
        >
          {SETTINGS_TABS.map((t) => {
            const active = tab === t.id;
            const danger = t.id === "delete";

            return (
              <Link
                key={t.id}
                href={`${basePath}?tab=${t.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 shrink-0 snap-start items-center gap-2.5",
                  "rounded-lg border px-3.5 py-2",
                  "text-xs font-semibold tracking-wide transition-all",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold",
                  active
                    ? "border-accent-gold/30 bg-accent-gold/10 text-accent-gold"
                    : danger
                      ? "border-white/5 bg-white/2 text-destructive/70"
                      : "border-white/5 bg-white/2 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
                    active
                      ? "bg-accent-gold/15"
                      : "bg-white/5 group-hover:bg-white/10",
                  )}
                >
                  <t.icon
                    className={cn("size-3.5", active && "text-accent-gold")}
                    aria-hidden
                  />
                </span>

                <span className="whitespace-nowrap">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar navigation */}
      <nav
        aria-label="Settings sections"
        className="hidden lg:flex lg:flex-col lg:gap-2 lg:rounded-xl lg:border lg:border-white/10 lg:bg-white/2 lg:p-2"
      >
        {SETTINGS_TABS.map((t) => {
          const active = tab === t.id;
          const danger = t.id === "delete";

          return (
            <Link
              key={t.id}
              href={`${basePath}?tab=${t.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-lg border p-2.5",
                "font-sans text-sm tracking-wide transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold",
                active
                  ? "border-accent-gold/20 bg-accent-gold/10 text-accent-gold"
                  : danger
                    ? "border-transparent text-destructive/70 hover:bg-white/5 hover:text-destructive"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                  active
                    ? "bg-accent-gold/15"
                    : "bg-white/4 group-hover:bg-white/8",
                )}
              >
                <t.icon className="size-4" aria-hidden />
              </span>

              <span className="min-w-0 flex-1 truncate">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
