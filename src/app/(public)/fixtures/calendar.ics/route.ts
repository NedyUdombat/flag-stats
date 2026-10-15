import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

function toICSDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: fixtures } = await supabase
    .from("fixtures")
    .select(
      "id, scheduled_at, venue, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)",
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(200);

  const events = (fixtures ?? [])
    .map((f) => {
      const homeTeamObj = Array.isArray(f.home_team)
        ? f.home_team[0]
        : f.home_team;
      const awayTeamObj = Array.isArray(f.away_team)
        ? f.away_team[0]
        : f.away_team;

      const home = homeTeamObj?.name ?? "TBD";
      const away = awayTeamObj?.name ?? "TBD";

      return [
        "BEGIN:VEVENT",
        `UID:${f.id}@zedistats`,
        `DTSTAMP:${toICSDate(new Date().toISOString())}`,
        `DTSTART:${toICSDate(f.scheduled_at)}`,
        `SUMMARY:${home} vs ${away}`,
        f.venue ? `LOCATION:${f.venue}` : "",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZediStats//Fixtures//EN",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": 'attachment; filename="zedistats-fixtures.ics"',
    },
  });
}
