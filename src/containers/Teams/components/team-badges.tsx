import { cn } from "@/utils/cn";

function Badge({
  tone,
  children,
}: {
  tone: "lime" | "amber" | "coral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-data text-[11px] uppercase",
        tone === "lime" && "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
        tone === "amber" && "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
        tone === "coral" && "border-zs-coral/40 bg-zs-coral/10 text-zs-coral",
      )}
    >
      {children}
    </span>
  );
}

export function TeamStatusBadges({
  claimed,
  deleted,
  orphaned,
}: {
  claimed: boolean;
  deleted: boolean;
  orphaned: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {deleted && <Badge tone="coral">Deleted</Badge>}
      {!deleted && !claimed && <Badge tone="amber">Unclaimed</Badge>}
      {!deleted && orphaned && <Badge tone="amber">No admin</Badge>}
      {!deleted && claimed && !orphaned && <Badge tone="lime">Active</Badge>}
    </span>
  );
}
