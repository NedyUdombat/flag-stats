import { Info } from "lucide-react";
import type { MyAthleteProfile } from "@/features/shared/types";
import { ageFromDob } from "@/lib/age";
import { Panel } from "../../shared/panel";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg borer border-white/10 bg-white/2.5 p-4 transition-colors hover:border-white/20">
      <dt className="font-sans text-[10px] uppercase tracking-[.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-slate-200 font-data">
        {value || "—"}
      </dd>
    </div>
  );
}

interface AthleteProfileDetailsProps {
  contactPhone: string | null;
  contactEmail: string | null;
  athlete: MyAthleteProfile["athlete"];
}
export function AthleteProfileDetails({
  athlete,
  contactPhone,
  contactEmail,
}: AthleteProfileDetailsProps) {
  const socials = Object.entries(
    (athlete.social_links ?? {}) as Record<string, string>,
  );

  const age = athlete.date_of_birth ? ageFromDob(athlete.date_of_birth) : null;

  return (
    <Panel
      title="Profile details"
      description={
        athlete.visibility === "public"
          ? "Your name, positions and stats are public. Your date of birth is shown publicly as age only."
          : "Your profile is hidden from public pages."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
          <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
            Personal information
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Profile ID" value={athlete.slug} />
            <Row label="Primary position" value={athlete.primary_position} />
            <Row
              label="Other positions"
              value={athlete.secondary_positions.join(", ")}
            />
            <Row label="Age" value={age?.toString()} />
            <Row label="Gender" value={athlete.gender} />
            <Row label="Nationality" value={athlete.nationality} />
            <Row label="Home city" value={athlete.home_city} />
            <Row
              label="Height"
              value={athlete.height_cm ? `${athlete.height_cm} cm` : null}
            />
            <Row
              label="Weight"
              value={athlete.weight_kg ? `${athlete.weight_kg} kg` : null}
            />
            <Row label="Dominant hand" value={athlete.dominant_hand} />
            <Row
              label="Started playing"
              value={athlete.started_playing_year?.toString()}
            />
            <Row
              label="Preferred jersey"
              value={athlete.preferred_jersey_number?.toString()}
            />
            <Row label="Visibility" value={athlete.visibility} />
          </dl>
        </div>

        {athlete.bio && (
          <div className="border-t border-white/10 pt-5 flex flex-col gap-3">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              About Me
            </h3>
            <p className="max-w-3xl text-sm leading-6 whitespace-pre-line text-slate-400">
              {athlete.bio ?? `-`}
            </p>
          </div>
        )}

        {socials.length > 0 && (
          <div className="border-t border-white/10 pt-5 flex flex-col gap-3">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
              Social presence
            </h3>
            <div className="flex flex-wrap gap-2">
              {socials.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-lg  bg-white/3 px-3 py-2 font-data text-xs text-slate-300"
                >
                  <span className="text-accent-gold">{key}</span>: @{value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-5 flex flex-col gap-3">
          <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
            Contact information
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Contact Phone" value={contactPhone} />
            <Row label="Contact Email" value={contactEmail} />
          </dl>
          <div className="flex items-center gap-3 rounded-lg border border-accent-gold/15 bg-accent-gold/4 px-4 py-3.5">
            <Info className="size-5 text-accent-gold" aria-hidden />

            <div className="min-w-0 space-y-1">
              <p className="text-xs leading-5 text-slate-400">
                {athlete.contact_visibility === "teams_and_scouts"
                  ? "Your contact details are visible only to approved teams, leagues, and scouts."
                  : "Your contact details are private and visible only to you."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
