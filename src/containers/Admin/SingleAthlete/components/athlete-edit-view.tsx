import Link from "next/link";

import type { AthleteRow } from "@/types/athletes/types";
import { AdminAthleteForm } from "../../Athletes/athlete-form/athlete-form";

export function AthleteEditView({
  athlete,
  athleteId,
}: {
  athlete: AthleteRow;
  athleteId: string;
}) {
  const viewHref = `/admin/athletes/${athleteId}`;
  return (
    <div className="space-y-6">
      <header className="">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/athletes" className="hover:text-zs-ink">
            Athletes
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link
            href={`/admin/athletes/${athleteId}`}
            className="hover:text-zs-ink"
          >
            {athlete.full_name}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Edit</span>
        </nav>
      </header>

      <AdminAthleteForm
        mode="edit"
        athleteId={athleteId}
        cancelHref={viewHref}
        initial={{
          fullName: athlete.full_name,
          dateOfBirth: athlete.date_of_birth ?? "",
          gender: athlete.gender ?? "",
          primaryPosition: athlete.primary_position ?? "",
        }}
      />
    </div>
  );
}
