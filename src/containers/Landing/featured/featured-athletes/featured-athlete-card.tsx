import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheckIconFill } from "@/components/icons";
import type { FeaturedAthlete } from ".";

interface FeaturedAthleteCardProps {
  athlete: FeaturedAthlete;
}
export function FeaturedAthleteCard({ athlete }: FeaturedAthleteCardProps) {
  return (
    <div
      key={athlete.id}
      className="group flex items-center p-4 bg-neutral-black first:rounded-tr-xl first:rounded-tl-xl gap-5"
    >
      <div className="relative h-30 w-30 shrink-0 overflow-hidden rounded-xl bg-neutral-gray-1">
        <Image
          src={athlete.avatarUrl}
          alt={athlete.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="120px"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-sans font-bold text-base tracking-wide text-white uppercase">
                {athlete.name}
              </h3>
              {athlete.isVerified && (
                <ShieldCheckIconFill
                  stroke="#FFF"
                  className="w-3 h-3 text-verified-green"
                />
              )}
            </div>
            <p className="font-data text-xs font-semibold uppercase text-accent-gold tracking-wide mt-0.5">
              {athlete.teamName}
            </p>
          </div>

          <span className="font-data text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            ID: <span className="text-accent-gold">{athlete.passportId}</span>
          </span>
        </div>

        <div className="flex items-center gap-8 my-2">
          <div>
            <p className="font-data text-base font-bold text-white leading-none">
              {athlete.caps}
            </p>
            <p className="font-data text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-1">
              CAPS
            </p>
          </div>

          <div>
            <p className="font-data text-base font-bold text-white leading-none">
              {athlete.touchdowns}
            </p>
            <p className="font-data text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-1">
              TOUCHDOWNS
            </p>
          </div>
        </div>

        <div>
          <Link
            href={`/athletes/${athlete.id}`}
            className="inline-flex items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
          >
            VIEW PASSPORT <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
