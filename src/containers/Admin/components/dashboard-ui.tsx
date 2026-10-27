import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  ClockIcon,
  HistoryIcon,
  type LucideIcon,
  ShieldPlusIcon,
  UserPlusIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";

// import type {
//   ActivityItem,
//   MatchState,
//   RecentMatch,
// } from "@/features/dashboard/services/dashboard.service";
import { cn } from "@/utils/cn";

export interface ActivityItem {
  id: string;
  at: string;
  status: MatchState;
  homeName: string;
  awayName: string;
  score: { home: number; away: number } | null;
}

export type MatchState =
  | "pending"
  | "approved"
  | "rejected"
  | "awaiting_result";

export interface RecentMatch {
  id: string;
  scheduledAt: string;
  competition: string | null;
  season: string | null;
  home: { id: string; name: string };
  away: { id: string; name: string };
  score: { home: number; away: number } | null;
  resultId: string | null;
  state: MatchState;
}

/* ---------------------------------- utils --------------------------------- */

// Change if leagues span timezones — server renders in UTC otherwise.
const DISPLAY_TZ = "Africa/Lagos";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: DISPLAY_TZ,
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TZ,
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

function teamCode(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return (
    words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)
  ).toUpperCase();
}

export type Accent = "lime" | "cyan" | "coral" | "amber" | "neutral";

const accentBorder: Record<Accent, string> = {
  lime: "border-b-zs-lime",
  cyan: "border-b-zs-cyan",
  coral: "border-b-zs-coral",
  amber: "border-b-zs-amber",
  neutral: "border-b-zs-line",
};
const accentText: Record<Accent, string> = {
  lime: "text-zs-lime",
  cyan: "text-zs-cyan",
  coral: "text-zs-coral",
  amber: "text-zs-amber",
  neutral: "text-zs-muted",
};

/* -------------------------------- stat tile ------------------------------- */

export function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  accent = "neutral",
  footer,
  display,
}: {
  label: string;
  value: number;
  /** Overrides the formatted number, e.g. "94.2%". */
  display?: string;
  caption: string;
  icon: LucideIcon;
  accent?: Accent;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col border-b-2 bg-zs-panel p-5",
        accentBorder[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-sm font-semibold tracking-wider text-zs-ink uppercase">
          {label}
        </h2>
        <Icon
          className={cn("size-5 shrink-0", accentText[accent])}
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "mt-3 font-display text-6xl leading-none font-bold tabular-nums",
          accent === "coral" && "text-zs-coral",
          accent === "amber" && "text-zs-amber",
          accent === "lime" && display && "text-zs-lime",
          !["coral", "amber"].includes(accent) &&
            !(accent === "lime" && display) &&
            "text-zs-ink",
        )}
      >
        {display ?? value.toLocaleString()}
      </p>
      <p className="mt-2 text-sm text-zs-muted">{caption}</p>
      {footer && (
        <div className="mt-auto border-t border-zs-line pt-3 font-data text-xs">
          {footer}
        </div>
      )}
    </section>
  );
}

/* -------------------------------- panels ---------------------------------- */

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

/* ------------------------------- match card ------------------------------- */

const _STATE_META: Record<
  MatchState,
  { label: string; icon: LucideIcon; pill: string; score: string }
> = {
  pending: {
    label: "Pending review",
    icon: ClockIcon,
    pill: "bg-zs-lime/10 text-zs-lime",
    score: "text-zs-lime",
  },
  approved: {
    label: "Official final",
    icon: BadgeCheckIcon,
    pill: "bg-zs-cyan/10 text-zs-cyan",
    score: "text-zs-ink",
  },
  rejected: {
    label: "Rejected",
    icon: XCircleIcon,
    pill: "bg-zs-coral/10 text-zs-coral",
    score: "text-zs-coral",
  },
  awaiting_result: {
    label: "Awaiting result",
    icon: CalendarClockIcon,
    pill: "bg-zs-raised text-zs-muted",
    score: "text-zs-muted",
  },
};

function _TeamSide({ name, align }: { name: string; align: "start" | "end" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "end" && "flex-row-reverse text-right",
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center bg-zs-raised font-data text-xs font-bold text-zs-ink">
        {teamCode(name)}
      </span>
      <span className="font-display text-xl leading-tight font-bold tracking-wide text-zs-ink uppercase">
        {name}
      </span>
    </div>
  );
}

const _btnBase =
  "inline-flex items-center gap-2 px-3 py-1.5 font-display text-sm font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";

// export function MatchCard({
//   match,
//   canVerify,
// }: {
//   match: RecentMatch;
//   canVerify: boolean;
// }) {
//   const meta = STATE_META[match.state];
//   const StateIcon = meta.icon;
//   const tag = [match.competition, match.season].filter(Boolean).join(" / ");

//   return (
//     <article className="bg-zs-bg/60 p-4">
//       <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-data text-xs">
//         <div className="flex flex-wrap items-center gap-3">
//           {tag && (
//             <span className="bg-zs-raised px-2 py-0.5 text-zs-lime">{tag}</span>
//           )}
//           <span className="text-zs-muted">{formatDate(match.scheduledAt)}</span>
//         </div>
//         <span
//           className={cn(
//             "inline-flex items-center gap-1.5 px-2 py-0.5 font-bold",
//             meta.pill,
//           )}
//         >
//           <StateIcon className="size-3.5" aria-hidden />
//           {meta.label}
//         </span>
//       </div>

//       <div className="grid gap-4 md:grid-cols-[1fr_auto]">
//         <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-zs-panel p-3">
//           <TeamSide name={match.home.name} align="start" />
//           <div
//             className={cn(
//               "bg-zs-raised px-3 py-1 text-center font-data text-2xl font-bold tabular-nums",
//               meta.score,
//             )}
//             aria-label={
//               match.score
//                 ? `${match.score.home} to ${match.score.away}`
//                 : "No score yet"
//             }
//           >
//             {match.score ? `${match.score.home}–${match.score.away}` : "–"}
//           </div>
//           <TeamSide name={match.away.name} align="end" />
//         </div>

//         <dl className="grid grid-cols-[auto_1fr] content-center gap-x-3 gap-y-1 font-data text-xs">
//           <dt className="text-zs-muted">Kick-off</dt>
//           <dd className="text-zs-ink">{formatTime(match.scheduledAt)}</dd>
//           <dt className="text-zs-muted">Result</dt>
//           <dd className={cn(match.resultId ? "text-zs-cyan" : "text-zs-muted")}>
//             {match.resultId ? "Submitted" : "Not submitted"}
//           </dd>
//         </dl>
//       </div>

//       <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-zs-line pt-3">
//         {match.state === "approved" && (
//           <p className="mr-auto font-data text-xs text-zs-muted">
//             Result verified and final
//           </p>
//         )}
//         <Link
//           href={`/admin/fixtures/${match.id}`}
//           className={cn(btnBase, "bg-zs-raised text-zs-ink hover:bg-zs-line")}
//         >
//           View fixture
//         </Link>
//         {match.state === "pending" && canVerify && (
//           <Link
//             href="/admin/verifications"
//             className={cn(
//               btnBase,
//               "bg-zs-lime text-zs-lime-ink hover:brightness-110",
//             )}
//           >
//             <CircleCheckIcon className="size-4" aria-hidden />
//             Review & approve
//           </Link>
//         )}
//       </div>
//     </article>
//   );
// }

export function MatchLegend({
  shown,
  total,
}: {
  shown: number;
  total: number;
}) {
  const items: [string, string][] = [
    ["bg-zs-lime", "Pending review"],
    ["bg-zs-cyan", "Official final"],
    ["bg-zs-coral", "Rejected"],
  ];
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 font-data text-xs text-zs-muted">
      <ul className="flex flex-wrap gap-4">
        {items.map(([dot, label]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", dot)} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
      <Link href="/admin/fixtures" className="hover:text-zs-ink">
        Showing {shown} of {total.toLocaleString()} matches
      </Link>
    </div>
  );
}

/* ------------------------------ quick actions ----------------------------- */

// `leagueOnly` actions follow the same visibility as the Verification nav item.
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

/* ----------------------------- recent activity ---------------------------- */

const ACTIVITY_VERB: Record<MatchState, string> = {
  pending: "awaiting verification",
  approved: "approved",
  rejected: "rejected",
  awaiting_result: "submitted",
};
const ACTIVITY_TIME: Record<MatchState, string> = {
  pending: "text-zs-lime",
  approved: "text-zs-cyan",
  rejected: "text-zs-coral",
  awaiting_result: "text-zs-muted",
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Panel title="Recent activity" icon={HistoryIcon}>
      {items.length === 0 ? (
        <p className="text-sm text-zs-muted">
          No results have been submitted yet. Submitted results appear here.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 bg-zs-bg/60 px-3 py-2.5 font-data text-sm sm:grid-cols-[auto_1fr_auto]"
            >
              <time
                dateTime={item.at}
                className={cn("font-bold", ACTIVITY_TIME[item.status])}
              >
                {formatTime(item.at)}
              </time>
              <span className="text-zs-ink">
                Result submitted: {item.homeName}
                {item.score ? ` ${item.score.home}–${item.score.away} ` : " v "}
                {item.awayName}, {ACTIVITY_VERB[item.status]}
              </span>
              <span className="col-start-2 text-xs text-zs-muted sm:col-start-3">
                {formatDate(item.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* -------------------------------- inline link ----------------------------- */

export function TileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between font-bold text-zs-lime hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime"
    >
      {children}
      <ArrowRightIcon className="size-4" aria-hidden />
    </Link>
  );
}
