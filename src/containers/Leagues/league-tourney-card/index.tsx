import { ChevronRightIcon } from "lucide-react";
import { getTournamentTint } from "@/containers/Tournaments/tints";
import type { LeagueTournament } from "@/features/leagues/league-profile.service";
import { cn } from "@/utils/cn";

interface LeagueTournamentCardProps {
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  tournament: LeagueTournament;
}

export function LeagueTournamentCard({
  selectedTournamentId,
  setSelectedTournamentId,
  tournament,
}: LeagueTournamentCardProps) {
  const isSelected = tournament.id === selectedTournamentId;
  const tintClass = getTournamentTint(tournament.id);

  return (
    <button
      key={tournament.id}
      type="button"
      onClick={() => setSelectedTournamentId(tournament.id)}
      className={cn(
        "group relative text-left rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between",
        tintClass,
        isSelected
          ? "ring-2 ring-accent shadow-xl scale-[1.01]"
          : "opacity-75 hover:opacity-100",
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-brand-lime uppercase tracking-wider">
            {tournament.season ?? "Season"} · {tournament.status ?? "Active"}
          </span>
          {isSelected && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[9px] text-accent uppercase tracking-wider">
              Viewing
            </span>
          )}
        </div>
        <h3 className="font-display text-base font-bold uppercase mt-2 text-white group-hover:text-accent-gold transition-colors">
          {tournament.name}
        </h3>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 font-mono text-[10px] text-white/60">
        <span>
          {tournament.startDate
            ? `Starts: ${new Date(tournament.startDate).toLocaleDateString("en-GB")}`
            : "Date TBA"}
        </span>
        <ChevronRightIcon className="size-4 text-white/40 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
