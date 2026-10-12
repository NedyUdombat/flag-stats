import { cn } from "@/utils/cn";

function Badge({
  tone,
  children,
}: {
  tone: "lime" | "amber" | "coral" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-data text-[11px] uppercase",
        tone === "lime" && "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
        tone === "amber" && "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
        tone === "coral" && "border-zs-coral/40 bg-zs-coral/10 text-zs-coral",
        tone === "muted" && "border-zs-line bg-zs-raised text-zs-muted",
      )}
    >
      {children}
    </span>
  );
}

export function LeagueStatusBadges(p: {
  claimed: boolean;
  deleted: boolean;
  orphaned: boolean;
  verified: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {p.deleted && <Badge tone="coral">Deleted</Badge>}
      {!p.deleted && !p.claimed && <Badge tone="amber">Unclaimed</Badge>}
      {!p.deleted && p.orphaned && <Badge tone="amber">No admin</Badge>}
      {!p.deleted &&
        p.claimed &&
        (p.verified ? (
          <Badge tone="lime">Verified</Badge>
        ) : (
          <Badge tone="muted">Unverified</Badge>
        ))}
    </span>
  );
}
