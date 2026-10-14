import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { FeaturedAthleteCard } from "./featured-athlete-card";

export interface FeaturedAthlete {
  id: string;
  passportId: string;
  name: string;
  teamName: string;
  avatarUrl: string;
  caps: number;
  touchdowns: number;
  isVerified?: boolean;
}

const DUMMY_ATHLETES: FeaturedAthlete[] = [
  {
    id: "1",
    passportId: "#42F261",
    name: "JANE DOE",
    teamName: "IZED UANIKHEHI",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    caps: 2,
    touchdowns: 8,
    isVerified: true,
  },
  {
    id: "2",
    passportId: "#42F261",
    name: "NEDY UDOMBAT",
    teamName: "TIGERS",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    caps: 2,
    touchdowns: 8,
    isVerified: true,
  },
  {
    id: "3",
    passportId: "#42F261",
    name: "CHIDIMMA TOBE",
    teamName: "LAGOS TITANS",
    avatarUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
    caps: 2,
    touchdowns: 8,
    isVerified: true,
  },
  {
    id: "4",
    passportId: "#42F261",
    name: "ASHER MCFARLANE",
    teamName: "SPARTANS",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    caps: 2,
    touchdowns: 8,
    isVerified: true,
  },
  {
    id: "5",
    passportId: "#42F261",
    name: "ZEGBUA",
    teamName: "LAGOS GIANTS",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    caps: 2,
    touchdowns: 8,
    isVerified: true,
  },
];

interface FeaturedAthletesProps {
  athletes?: FeaturedAthlete[];
  className?: string;
}

export function FeaturedAthletes({
  athletes = DUMMY_ATHLETES,
  className,
}: FeaturedAthletesProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-neutral-covert p-3 sm:p-5 shadow-2xl w-full max-w-full overflow-hidden",
        className,
      )}
    >
      {/* Responsive Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
          Featured Athletes
        </h2>
        <Link
          href="/athletes"
          className="group inline-flex items-center gap-1 font-data text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-accent-gold hover:underline shrink-0"
        >
          <span>REGISTRY</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="divide-y divide-white/5 w-full">
        {athletes.map((athlete) => (
          <FeaturedAthleteCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </div>
  );
}
