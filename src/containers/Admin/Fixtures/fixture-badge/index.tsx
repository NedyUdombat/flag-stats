import {
  FIXTURE_STATUS_LABELS,
  type FixtureStatus,
  RESULT_STATUS_LABELS,
} from "@/features/fixtures/fixture.constants";
import { cn } from "@/utils/cn";

type Tone = "lime" | "amber" | "coral" | "muted";
const cls = (tone: Tone) =>
  cn(
    "inline-flex items-center border px-2 py-0.5 font-data text-[11px] uppercase",
    tone === "lime" && "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
    tone === "amber" && "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
    tone === "coral" && "border-zs-coral/40 bg-zs-coral/10 text-zs-coral",
    tone === "muted" && "border-zs-line bg-zs-raised text-zs-muted",
  );

const STATUS_TONE: Record<FixtureStatus, Tone> = {
  scheduled: "muted",
  in_progress: "amber",
  completed: "lime",
  cancelled: "coral",
};
export const FixtureStatusBadge = ({ status }: { status: string }) => (
  <span className={cls(STATUS_TONE[status as FixtureStatus] ?? "muted")}>
    {FIXTURE_STATUS_LABELS[status as FixtureStatus] ?? status}
  </span>
);

const RESULT_TONE = {
  pending: "amber",
  approved: "lime",
  rejected: "coral",
} as const;
export const ResultStatusBadge = ({
  status,
}: {
  status: keyof typeof RESULT_TONE;
}) => (
  <span className={cls(RESULT_TONE[status])}>
    {RESULT_STATUS_LABELS[status]}
  </span>
);

export const VoidedBadge = () => <span className={cls("coral")}>Voided</span>;
export const DisputeBadge = ({ count }: { count: number }) => (
  <span className={cls("amber")}>
    {count} dispute{count === 1 ? "" : "s"}
  </span>
);
