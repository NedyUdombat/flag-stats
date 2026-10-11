import { type NextRequest, NextResponse } from "next/server";
import { isAthleteStatus } from "@/features/admin-athlete/admin-athlete.constants";
import { listAllAdminAthletes } from "@/features/admin-athlete/admin-athlete.service";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import { getCurrentUser } from "@/features/users/user.service";
import { canAccessAdminConsole } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";

// Quote everything; neutralise formula injection (=, +, -, @) from user-entered names.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canAccessAdminConsole(user))
    return new NextResponse("Forbidden", { status: 403 });
  if (!(await rateLimit(rateKey("athlete-export", user.id), 10, 3600))) {
    return new NextResponse("Too many exports. Try again later.", {
      status: 429,
    });
  }

  const p = req.nextUrl.searchParams;
  const status = p.get("status") ?? undefined;
  const position = p.get("position") ?? "";
  const rows = await listAllAdminAthletes({
    q: p.get("q")?.trim() || undefined,
    status: isAthleteStatus(status) ? status : undefined,
    position: (POSITIONS as readonly string[]).includes(position)
      ? position
      : undefined,
  });

  // Public-level fields only: no DOB, email or phone.
  const header = [
    "Name",
    "Profile ID",
    "Primary position",
    "Other positions",
    "Club",
    "Claimed",
    "Verified",
  ];
  const lines = rows.map((a) =>
    [
      a.fullName,
      a.slug,
      a.primaryPosition,
      a.secondaryPositions.join("; "),
      a.teamName,
      a.claimed ? "yes" : "no",
      a.verified ? "yes" : "no",
    ]
      .map(cell)
      .join(","),
  );
  return new NextResponse([header.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="athletes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
