import {
  ROSTER_FLAG_LABELS,
  ROSTER_STATUS_LABELS,
  type RosterEntryStatus,
} from "@/features/rosters/roster.constants";
import { cn } from "@/utils/cn";

const TONE = {
  pending: "amber",
  accepted: "lime",
  rejected: "coral",
  withdrawn: "muted",
} as const;

export function EntryStatusBadge({ status }: { status: string }) {
  const s = (status in TONE ? status : "pending") as RosterEntryStatus;
  const tone = TONE[s];
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
      {ROSTER_STATUS_LABELS[s]}
    </span>
  );
}

export function FlagBadges({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((f) => (
        <span
          key={f}
          title={ROSTER_FLAG_LABELS[f]?.hint}
          className="border border-zs-amber/40 bg-zs-amber/10 px-1.5 py-0.5 font-data text-[10px] text-zs-amber uppercase"
        >
          {ROSTER_FLAG_LABELS[f]?.label ?? f}
        </span>
      ))}
    </span>
  );
}
