import Link from "next/link";
import type { PublicAthleteListItem } from "@/features/athletes/actions/athlete-public.actions";

export function AthleteDirectoryCard({
  athlete,
}: {
  athlete: PublicAthleteListItem;
}) {
  const profileId = `ZDS-${athlete.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        {athlete.verified ? (
          <span className="rounded-sm bg-brand-lime/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brand-lime uppercase">
            ✓ Verified
          </span>
        ) : (
          <span className="rounded-sm bg-white/5 px-2 py-0.5 font-mono text-[10px] tracking-wide text-white/40 uppercase">
            Unverified
          </span>
        )}
        {athlete.jerseyNumber ? (
          <span className="font-mono text-xs text-white/30">
            #{athlete.jerseyNumber}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0 overflow-hidden rounded-md bg-black/40">
          {athlete.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external Cloudinary URLs
            <img
              src={athlete.photoUrl}
              alt={athlete.fullName}
              className="size-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          {athlete.teamName ? (
            <p className="truncate font-mono text-[10px] text-brand-lime uppercase">
              {athlete.teamName}
            </p>
          ) : null}
          <p className="truncate font-display text-base uppercase">
            {athlete.fullName}
          </p>
          <p className="font-mono text-[10px] text-white/40 uppercase">
            {athlete.primaryPosition ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-sm bg-black/30 px-2 py-1 font-mono text-[10px] text-[#45B9D3] uppercase">
        Profile ID {profileId}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div>
          <p className="font-mono text-lg text-white">0</p>
          {/* <p className="font-mono text-lg text-white">{athlete.gamesPlayed}</p> */}
          <p className="font-mono text-[10px] text-white/40 uppercase">Caps</p>
        </div>
        <div>
          <p className="font-mono text-lg text-brand-lime">
            {athlete.touchdowns}
          </p>
          <p className="font-mono text-[10px] text-white/40 uppercase">
            Touchdowns
          </p>
        </div>
      </div>

      <Link
        href={`/athletes/${athlete.slug}`}
        className="mt-3 block rounded-sm border border-white/10 py-2 text-center font-mono text-[10px] tracking-wide text-white/70 uppercase hover:border-brand-lime hover:text-brand-lime"
      >
        View full passport →
      </Link>
    </div>
  );
}
