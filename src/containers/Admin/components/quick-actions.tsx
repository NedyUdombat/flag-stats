import {
  BadgeCheckIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  type LucideIcon,
  ShieldPlusIcon,
  UserPlusIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
// import { Panel } from "@/containers/Account/shared/panel";
import { cn } from "@/utils/cn";

const ACTIONS = [
  {
    title: "Schedule match",
    body: "Set fixtures, venues and officials",
    href: "/admin/fixtures/new",
    icon: CalendarPlusIcon,
    leagueOnly: false,
  },
  {
    title: "Register club",
    body: "Add a team to a league",
    href: "/admin/teams/new",
    icon: ShieldPlusIcon,
    leagueOnly: false,
  },
  {
    title: "Add athlete",
    body: "Create a player profile",
    href: "/admin/athletes/new",
    icon: UserPlusIcon,
    leagueOnly: false,
  },
  {
    title: "Verification queue",
    body: "Approve results and player stats",
    href: "/admin/verifications",
    icon: BadgeCheckIcon,
    leagueOnly: true,
  },
];

export function Panel({
  title,
  icon: Icon,
  aside,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-zs-panel p-5", className)}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-wide text-zs-ink uppercase">
          {Icon ? (
            <Icon className="size-5 text-zs-lime" aria-hidden />
          ) : (
            <span className="size-2.5 rounded-full bg-zs-lime" aria-hidden />
          )}
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function QuickActions({ canVerify }: { canVerify: boolean }) {
  const actions = ACTIONS.filter((a) => !a.leagueOnly || canVerify);
  return (
    <Panel title="Quick actions" icon={ZapIcon}>
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex items-center gap-3 bg-zs-bg/60 p-3 hover:bg-zs-raised focus-visible:outline-2 focus-visible:outline-zs-lime"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center",
                  i === 0
                    ? "bg-zs-lime/15 text-zs-lime"
                    : "bg-zs-raised text-zs-ink",
                )}
              >
                <a.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-bold tracking-wide text-zs-ink uppercase">
                  {a.title}
                </span>
                <span className="block text-sm text-zs-muted">{a.body}</span>
              </span>
              <ChevronRightIcon
                className="size-4 text-zs-muted group-hover:text-zs-ink"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
