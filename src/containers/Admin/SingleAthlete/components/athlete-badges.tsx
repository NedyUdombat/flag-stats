import { cn } from "@/utils/cn";

function Badge({
  tone,
  children,
}: {
  tone: "lime" | "amber" | "coral" | "green";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 font-data text-[10px] uppercase rounded-md",
        tone === "lime" && "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
        tone === "green" &&
          "border-green-400/40 bg-green-400/10 text-green-400",
        tone === "amber" && "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
        tone === "coral" && "border-zs-coral/40 bg-zs-coral/10 text-zs-coral",
      )}
    >
      {children}
    </span>
  );
}

export function AthleteStatusBadges({
  claimed,
  deleted,
  verified,
}: {
  claimed: boolean;
  deleted: boolean;
  verified: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {deleted && <Badge tone="coral">Deleted</Badge>}
      {!deleted && !claimed && <Badge tone="amber">Unclaimed</Badge>}
      {!deleted && claimed && <Badge tone="lime">Active</Badge>}
      {!deleted && claimed && verified && <Badge tone="green">Verified</Badge>}
    </span>
  );
}
