import { format } from "date-fns";
import { Panel } from "@/containers/Account/shared/panel";
import type { TeamDetail } from "./team-detail.types";

const HEX = /^#[0-9a-f]{6}$/i;

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

export function TeamProfilePanel({ team }: { team: TeamDetail }) {
  const socials = Object.entries(
    (team.social_links ?? {}) as Record<string, string>,
  );

  const colors = [team.primary_color, team.accent_color].filter(
    (color): color is string => Boolean(color && HEX.test(color)),
  );

  return (
    <Panel>
      <div className="flex flex-col gap-5">
        {/* Team information */}
        <div className="flex flex-col">
          <dl className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <Row label="Team name" value={team.name} />
            <Row label="Short name" value={team.short_name} />
            <Row label="Slug" value={team.slug} />
            <Row label="Home city" value={team.home_city} />
            <Row label="Country" value={team.country} />
            <Row label="Home ground" value={team.home_ground} />
            <Row label="Founded" value={team.founded_year?.toString()} />
            <Row label="Head coach" value={team.head_coach_name} />
            <Row
              label="Created at"
              value={format(new Date(team.created_at), "MM dd yyyy")}
            />
            <div className="col-span-2">
              <Row label="Slogan" value={team.slogan} />
            </div>
          </dl>
        </div>

        {/* About team */}
        {team.bio && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              About the team
            </h3>

            <p className="max-w-3xl text-sm leading-6 whitespace-pre-line text-slate-400">
              {team.bio}
            </p>
          </div>
        )}

        {/* Team colours */}
        {colors.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              Team colours
            </h3>

            <div className="flex flex-wrap gap-3">
              {colors.map((color, index) => (
                <div
                  key={`${color}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2"
                >
                  <span
                    aria-hidden
                    className="size-5 rounded border border-white/10"
                    style={{ backgroundColor: color }}
                  />

                  <span className="font-data text-xs text-slate-300">
                    <span className="text-accent-gold">
                      {index === 0 ? "Primary" : "Accent"}
                    </span>
                    {" · "}
                    {color.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
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
