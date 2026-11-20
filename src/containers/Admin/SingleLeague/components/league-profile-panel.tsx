import { format } from "date-fns";
import { Panel } from "@/containers/Account/shared/panel";
import type { LeagueDetail } from "./league-detail.types";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg borer border-white/10 bg-white/2.5 p-4 transition-colors hover:border-white/20">
      <dt className="font-sans text-[10px] uppercase tracking-[.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-slate-200 font-data">
        {value || "—"}
      </dd>
    </div>
  );
}

export function LeagueProfilePanel({ league }: { league: LeagueDetail }) {
  const socials = Object.entries(
    (league.social_links ?? {}) as Record<string, string>,
  );

  return (
    <Panel>
      <div className="flex flex-col gap-5">
        {/* league information */}
        <div className="flex flex-col">
          <dl className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <Row label="league name" value={league.name} />
            <Row label="Short code" value={league.short_code} />
            <Row label="Slug" value={league.slug} />
            <Row label="Home city" value={league.region} />
            <Row label="Country" value={league.country} />
            <Row
              label="Organization(Federation)"
              value={league.organization?.name}
            />
            <Row label="Format" value={league.format} />
            <Row label="Competition level" value={league.competition_level} />
            <Row label="Commissioner" value={league.commissioner_name} />
            <Row label="Max Teams" value={league.max_teams?.toString()} />
            <Row label="Roster Limit" value={league.roster_limit?.toString()} />
            <Row label="Rule Book" value={league.rulebook} />
            <Row
              label="Created at"
              value={format(new Date(league.created_at), "MM dd yyyy")}
            />
          </dl>
        </div>

        {/* TODO: About League  */}
        {league.description && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              About the league
            </h3>

            <p className="max-w-3xl text-sm leading-6 whitespace-pre-line text-slate-400">
              {league.description}
            </p>
          </div>
        )}

        {/* Social presence */}
        {socials.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              Social presence
            </h3>

            <div className="flex flex-wrap gap-2">
              {socials.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-lg bg-white/3 px-3 py-2 font-data text-xs text-slate-300"
                >
                  <span className="text-accent-gold">{key}</span>: @{value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
