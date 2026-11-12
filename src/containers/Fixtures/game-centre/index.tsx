"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { GameCentrePlayer } from "@/features/stats/services/fixture-game-centre.service";

type Fixture = {
  id: string;
  status: string;
  voided: boolean;
  scheduledAt: string;
  venue: string | null;
  pitch: string | null;
  tournament: { name: string; leagueName: string | null };
  home: { id: string; name: string; logoUrl: string | null };
  away: { id: string; name: string; logoUrl: string | null };
  result: { homeScore: number; awayScore: number; status: string } | null;
};
type Tab = "overview" | "players" | "teams";
type Category = "Passing" | "Rushing" | "Receiving" | "Defense";
const categories: { name: Category; metrics: [string, string][] }[] = [
  {
    name: "Passing",
    metrics: [
      ["Completions", "pass_completions"],
      ["Attempts", "pass_attempts"],
      ["Yards", "passing_yards"],
      ["TDs", "passing_touchdowns"],
      ["1PATs", "pass_1PAT"],
      ["2PATs", "pass_2PAT"],
      ["INT", "Int_thrown"],
    ],
  },
  {
    name: "Rushing",
    metrics: [
      ["Attempts", "rush_attempts"],
      ["Yards", "rushing_yards"],
      ["TDs", "rushing_touchdowns"],
      ["1PATs", "rushing_1PATs"],
      ["2PATs", "rushing_2PATs"],
    ],
  },
  {
    name: "Receiving",
    metrics: [
      ["Targets", "targets"],
      ["Catches", "catches"],
      ["Drops", "drops"],
      ["Yards", "rec_yards"],
      ["TDs", "receiving_touchdowns"],
      ["1PATs", "receiving_1PATs"],
      ["2PATs", "receiving_2PATs"],
    ],
  },
  {
    name: "Defense",
    metrics: [
      ["Sacks", "Sacks"],
      ["INT caught", "Int_caught"],
      ["Pick-sixes", "Int_returned"],
      ["Pass breakups", "pass_breakups"],
      ["Flag pulls", "flag_pulls"],
      ["Safeties", "safeties"],
    ],
  },
];
const scoringMetrics = [
  "passing_touchdowns",
  "rushing_touchdowns",
  "receiving_touchdowns",
  "pass_1PAT",
  "pass_2PAT",
  "rushing_1PATs",
  "rushing_2PATs",
  "receiving_1PATs",
  "receiving_2PATs",
  "Int_returned",
  "safeties",
];
const n = (player: GameCentrePlayer, key: string) => player.stats[key] ?? 0;
const sum = (players: GameCentrePlayer[], key: string) =>
  players.reduce((total, p) => total + n(p, key), 0);

export function FixtureGameCentre({
  fixture,
  players,
}: {
  fixture: Fixture;
  players: GameCentrePlayer[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [teamId, setTeamId] = useState(fixture.home.id);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<Category, boolean>>({
    Passing: true,
    Rushing: true,
    Receiving: true,
    Defense: true,
  });
  const [selected, setSelected] = useState<GameCentrePlayer | null>(null);
  const homePlayers = useMemo(
    () => players.filter((p) => p.teamId === fixture.home.id),
    [players, fixture.home.id],
  );
  const awayPlayers = useMemo(
    () => players.filter((p) => p.teamId === fixture.away.id),
    [players, fixture.away.id],
  );
  const teamPlayers = players.filter(
    (p) =>
      p.teamId === teamId && p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const score = fixture.result?.status === "approved" ? fixture.result : null;
  const official = fixture.status === "completed" && !fixture.voided;
  const teamName = (id: string) =>
    id === fixture.home.id ? fixture.home.name : fixture.away.name;
  const metricKeys = categories.flatMap((c) => c.metrics.map((m) => m[1]));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <header className="overflow-hidden rounded-xl border border-white/10 bg-neutral-950 text-white">
        <div className="border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-white/60">
          {fixture.tournament.name} ·{" "}
          {fixture.voided ? "Voided" : fixture.status.replaceAll("_", " ")}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-7 sm:px-8">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Avatar className="size-14">
              <AvatarImage src={fixture.home.logoUrl ?? ""} />
              <AvatarFallback>{fixture.home.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-display text-sm font-bold uppercase sm:text-xl">
              {fixture.home.name}
            </span>
            <strong className="font-mono text-4xl sm:text-5xl">
              {score?.homeScore ?? "–"}
            </strong>
          </div>
          <div className="text-center">
            <div className="font-data text-xs uppercase tracking-widest text-white/50">
              {official ? "Final" : "VS"}
            </div>
            <div className="my-2 text-xs text-white/50">
              {new Date(fixture.scheduledAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Avatar className="size-14">
              <AvatarImage src={fixture.away.logoUrl ?? ""} />
              <AvatarFallback>{fixture.away.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-display text-sm font-bold uppercase sm:text-xl">
              {fixture.away.name}
            </span>
            <strong className="font-mono text-4xl sm:text-5xl">
              {score?.awayScore ?? "–"}
            </strong>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/50">
          {fixture.venue ?? "Venue TBC"}
          {fixture.pitch ? ` · Pitch ${fixture.pitch}` : ""}
        </div>
      </header>

      <nav
        className="flex border-b border-white/10"
        aria-label="Fixture statistics tabs"
      >
        {(
          [
            ["overview", "Overview"],
            ["players", "Player Stats"],
            ["teams", "Team Stats"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? "border-brand-lime text-brand-lime" : "border-transparent text-white/55 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-5">
            <h2 className="mb-4 font-display text-lg font-bold uppercase text-white">
              Match information
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-white/45">Competition</dt>
                <dd className="mt-1 text-white">{fixture.tournament.name}</dd>
              </div>
              <div>
                <dt className="text-white/45">Date</dt>
                <dd className="mt-1 text-white">
                  {new Date(fixture.scheduledAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Venue</dt>
                <dd className="mt-1 text-white">{fixture.venue ?? "TBC"}</dd>
              </div>
              <div>
                <dt className="text-white/45">Status</dt>
                <dd className="mt-1 capitalize text-white">
                  {fixture.status.replaceAll("_", " ")}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-5">
            <h2 className="mb-4 font-display text-lg font-bold uppercase text-white">
              Scoring summary
            </h2>
            {official ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  [
                    "Touchdowns",
                    ["rushing_touchdowns", "receiving_touchdowns"],
                  ],
                  [
                    "PATs",
                    [
                      "rushing_1PATs",
                      "rushing_2PATs",
                      "receiving_1PATs",
                      "receiving_2PATs",
                    ],
                  ],
                  ["Pick-sixes", ["Int_returned"]],
                  ["Safeties", ["safeties"]],
                ].map(([label, keys]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg bg-white/5 p-3"
                  >
                    <div className="text-xs text-white/45">{String(label)}</div>
                    <div className="mt-1 font-mono text-2xl text-white">
                      {(keys as string[]).reduce(
                        (v, k) => v + sum(players, k),
                        0,
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">
                Official player statistics will appear after the fixture is
                completed and approved lines are available.
              </p>
            )}
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-5 lg:col-span-2">
            <h2 className="mb-4 font-display text-lg font-bold uppercase text-white">
              Team highlights
            </h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-white/45">{fixture.home.name}</p>
                <p className="mt-1 font-mono text-2xl text-white">
                  {sum(homePlayers, "passing_yards") +
                    sum(homePlayers, "rushing_yards") +
                    sum(homePlayers, "rec_yards")}
                </p>
                <p className="text-xs text-white/45">Total player yards</p>
              </div>
              <div>
                <p className="text-xs text-white/45">{fixture.away.name}</p>
                <p className="mt-1 font-mono text-2xl text-white">
                  {sum(awayPlayers, "passing_yards") +
                    sum(awayPlayers, "rushing_yards") +
                    sum(awayPlayers, "rec_yards")}
                </p>
                <p className="text-xs text-white/45">Total player yards</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab("players")}
              className="mt-5 text-sm font-semibold text-brand-lime"
            >
              View detailed player stats →
            </button>
          </section>
        </div>
      )}

      {tab === "players" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-lg border border-white/10 p-1">
              {[fixture.home, fixture.away].map((team) => (
                <button
                  type="button"
                  key={team.id}
                  onClick={() => setTeamId(team.id)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${teamId === team.id ? "bg-white/10 text-white" : "text-white/50"}`}
                >
                  {team.name}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players…"
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white sm:w-64"
            />
          </div>
          {categories.map((category) => (
            <div
              key={category.name}
              className="overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
            >
              <button
                type="button"
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [category.name]: !prev[category.name],
                  }))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left font-display font-bold uppercase text-white"
              >
                <span>{category.name}</span>
                <span className="text-white/50">
                  {open[category.name] ? "−" : "+"}
                </span>
              </button>
              {open[category.name] && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-white/5 text-white/45">
                      <tr>
                        <th className="px-4 py-3">Player</th>
                        {category.metrics.map(([label]) => (
                          <th key={label} className="px-3 py-3 text-right">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamPlayers.map((player) => (
                        <tr
                          key={player.athleteId}
                          className="border-t border-white/5 text-white/80"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelected(player)}
                              className="font-semibold hover:text-brand-lime"
                            >
                              {player.name}
                            </button>
                          </td>
                          {category.metrics.map(([_label, key]) => (
                            <td
                              key={key}
                              className="px-3 py-3 text-right font-mono"
                            >
                              {n(player, key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {teamPlayers.length === 0 && (
                    <p className="px-4 py-5 text-sm text-white/45">
                      No approved player lines found.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "teams" && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-950">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white">
                <th className="px-4 py-4 text-left">Category / Metric</th>
                <th className="px-4 py-4 text-right">{fixture.home.name}</th>
                <th className="px-4 py-4 text-right">{fixture.away.name}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <Fragment key={category.name}>
                  {
                    <tr key={`${category.name}-head`} className="bg-white/5">
                      <th
                        colSpan={3}
                        className="px-4 py-3 text-left font-display uppercase text-white"
                      >
                        {category.name}
                      </th>
                    </tr>
                  }
                  {category.metrics.map(([label, key]) => (
                    <tr
                      key={key}
                      className="border-t border-white/5 text-white/75"
                    >
                      <td className="px-4 py-3">{label}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {sum(homePlayers, key)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {sum(awayPlayers, key)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="bg-white/5">
                <th
                  colSpan={3}
                  className="px-4 py-3 text-left font-display uppercase text-white"
                >
                  Scoring
                </th>
              </tr>
              {scoringMetrics.map((key) => (
                <tr key={key} className="border-t border-white/5 text-white/75">
                  <td className="px-4 py-3">{key.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {sum(homePlayers, key)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {sum(awayPlayers, key)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} game stats`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
          onKeyDown={() => setSelected(null)}
        >
          <section className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-white/10 bg-neutral-950 p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">
                  {selected.name}
                </h2>
                <p className="text-xs text-white/50">
                  {teamName(selected.teamId)} · Complete game stats
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-white/60"
              >
                Close ✕
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metricKeys.map((key) => (
                <div key={key} className="rounded-lg bg-white/5 p-3">
                  <div className="text-[10px] uppercase text-white/45">
                    {key.replaceAll("_", " ")}
                  </div>
                  <div className="mt-1 font-mono text-xl">
                    {n(selected, key)}
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] uppercase text-white/45">
                  Participation
                </div>
                <div className="mt-1 text-sm">Played</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
