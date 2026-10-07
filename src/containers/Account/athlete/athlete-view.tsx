import { BadgeCheckIcon, ExternalLinkIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import type { MyAthleteProfile } from "@/features/shared/types";
import { ageFromDob } from "@/lib/age";
import { Panel } from "../shared/panel";
import { buttonPrimary, buttonSecondary } from "../styles";
import { AthleteDangerZone } from "./athlete-danger-zone";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border border-zs-line px-3 py-2.5">
      <dt className="font-data text-[11px] text-zs-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-zs-ink">{value || "—"}</dd>
    </div>
  );
}

export function AthleteView({
  profile,
  editHref,
  viewHref,
}: {
  profile: MyAthleteProfile;
  editHref: string;
  viewHref: string;
}) {
  const { athlete: a, contactPhone, careerTotals } = profile;
  const socials = Object.entries(
    (a.social_links ?? {}) as Record<string, string>,
  );
  const age = a.date_of_birth ? ageFromDob(a.date_of_birth) : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 border border-zs-line bg-zs-panel p-5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            {a.full_name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-zs-muted">
            {a.verified ? (
              <span className="inline-flex items-center gap-1 text-zs-lime">
                <BadgeCheckIcon className="size-4" aria-hidden /> Verified
              </span>
            ) : (
              <span>
                Not verified yet. You&apos;re verified once a league accepts a
                roster you&apos;re on.
              </span>
            )}
            {careerTotals && (
              <span className="font-data text-xs">
                {careerTotals.gamesPlayed} verified games ·{" "}
                {careerTotals.touchdowns} TD
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={editHref} className={buttonPrimary}>
            <PencilIcon className="size-4" aria-hidden />
            Edit
          </Link>
          <Link
            href={`/athletes/${a.slug}`}
            target="_blank"
            rel="noopener"
            className={buttonSecondary}
          >
            <ExternalLinkIcon className="size-4" aria-hidden />
            Preview public page
          </Link>
        </div>
      </section>

      <Panel
        title="Profile details"
        description={
          a.visibility === "public"
            ? "Your name, positions and stats are public. Your date of birth is shown publicly as age only."
            : "Your profile is hidden from public pages."
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Profile ID" value={`/athletes/${a.slug}`} />
          <Row label="Positions" value={a.positions.join(", ")} />
          <Row label="Age" value={age?.toString()} />
          <Row label="Gender" value={a.gender} />
          <Row label="Nationality" value={a.nationality} />
          <Row label="Home city" value={a.home_city} />
          <Row
            label="Height"
            value={a.height_cm ? `${a.height_cm} cm` : null}
          />
          <Row
            label="Weight"
            value={a.weight_kg ? `${a.weight_kg} kg` : null}
          />
          <Row label="Dominant hand" value={a.dominant_hand} />
          <Row
            label="Started playing"
            value={a.started_playing_year?.toString()}
          />
          <Row
            label="Preferred jersey"
            value={a.preferred_jersey_number?.toString()}
          />
          <Row label="Visibility" value={a.visibility} />
        </dl>
        {a.bio && (
          <p className="mt-4 max-w-3xl text-sm whitespace-pre-line text-zs-ink">
            {a.bio}
          </p>
        )}
        {socials.length > 0 && (
          <p className="mt-4 font-data text-xs text-zs-muted">
            {socials.map(([k, v]) => `${k}: @${v}`).join("  ·  ")}
          </p>
        )}
        <p className="mt-4 font-data text-xs text-zs-muted">
          Private to you: phone {contactPhone ?? "not set"}
        </p>
      </Panel>

      <AthleteDangerZone viewHref={viewHref} />
    </div>
  );
}
