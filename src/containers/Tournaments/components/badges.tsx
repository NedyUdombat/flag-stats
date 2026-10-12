import {
  REGISTRATION_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  type TournamentStatus,
} from "@/features/tournaments/tournament.constants";
import { cn } from "@/utils/cn";

type Tone = "lime" | "amber" | "coral" | "muted";
function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
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

const STATUS_TONE: Record<TournamentStatus, Tone> = {
  draft: "muted",
  registration_open: "lime",
  in_progress: "amber",
  completed: "muted",
  cancelled: "coral",
};

export function TournamentStatusBadge({
  status,
}: {
  status: TournamentStatus;
}) {
  return (
    <Badge tone={STATUS_TONE[status]}>{TOURNAMENT_STATUS_LABELS[status]}</Badge>
  );
}

const REG_TONE = {
  pending: "amber",
  approved: "lime",
  rejected: "coral",
  withdrawn: "muted",
} as const;

export function RegistrationStatusBadge({
  status,
}: {
  status: keyof typeof REG_TONE;
}) {
  return (
    <Badge tone={REG_TONE[status]}>{REGISTRATION_STATUS_LABELS[status]}</Badge>
  );
}
