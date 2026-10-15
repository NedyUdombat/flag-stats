import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { AdminAthleteForm } from "@/containers/Admin/Athletes/athlete-form/athlete-form";
import { UnclaimedDangerZone } from "@/containers/Admin/Athletes/danger-zone/danger-zone";
import { InvitePanel } from "@/containers/Admin/Athletes/invite-panel/invite-panel";
import { getAdminAthleteDetail } from "@/features/admin-athlete/admin-athlete.service";
import { getAthleteRosters } from "@/features/rosters/roster.service";
import { getCurrentUser } from "@/features/users/user.service";
import { ageFromDob } from "@/lib/age";
import { canManageUnclaimedAthlete } from "@/lib/permissions";
import { fmtDate, fmtDay } from "@/utils/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export default async function AdminAthleteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; sent?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/athletes/${id}`);

  const detail = await getAdminAthleteDetail(id).catch(() => null);
  if (!detail) notFound();

  const a = detail.athlete;
  const claimed = !!a.profile_user_id;
  const canManage = canManageUnclaimedAthlete(user, {
    profileUserId: a.profile_user_id,
    createdBy: a.created_by,
  });
  const viewHref = `/admin/athletes/${id}`;

  const rosters = await getAthleteRosters(id);

  if (sp.mode === "edit" && canManage) {
    return (
      <AdminAthleteForm
        mode="edit"
        athleteId={id}
        cancelHref={viewHref}
        initial={{
          fullName: a.full_name,
          dateOfBirth: a.date_of_birth ?? "",
          gender: a.gender ?? "",
          primaryPosition: a.primary_position ?? "",
        }}
      />
    );
  }

  const age = a.date_of_birth ? ageFromDob(a.date_of_birth) : null;

  return (
    <div className="space-y-6">
      {sp.sent === "1" && (
        <p
          // role="status"
          className="border border-zs-lime/40 bg-zs-lime/10 px-4 py-3 text-sm text-zs-lime"
        >
          Athlete created and invitation sent.
        </p>
      )}
      {sp.sent === "0" && (
        <p
          role="alert"
          className="border border-zs-amber/40 bg-zs-amber/10 px-4 py-3 text-sm text-zs-ink"
        >
          Athlete created, but the email couldn&apos;t be sent. Use Resend
          below.
        </p>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zs-line pb-5">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
            <Link href="/admin/athletes" className="hover:text-zs-ink">
              Athletes
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-zs-ink">{a.full_name}</span>
          </nav>
          <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            {a.full_name}
          </h1>
          <p className="mt-2 text-sm text-zs-muted">
            {claimed
              ? "Claimed. Only the athlete can edit this profile."
              : "Unclaimed. Waiting for the athlete to claim it."}
            {a.verified && " · Verified"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canManage && (
            <Link href={`${viewHref}?mode=edit`} className={buttonPrimary}>
              <PencilIcon className="size-4" aria-hidden /> Edit
            </Link>
          )}
          {claimed && a.visibility === "public" && (
            <Link
              href={`/athletes/${a.slug}`}
              target="_blank"
              rel="noopener"
              className={buttonSecondary}
            >
              <ExternalLinkIcon className="size-4" aria-hidden /> Public page
            </Link>
          )}
        </div>
      </header>

      <Panel title="Profile">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Primary position" value={a.primary_position} />
          <Row
            label="Other positions"
            value={a.secondary_positions.join(", ")}
          />
          <Row label="Gender" value={a.gender} />
          <Row
            label={canManage ? "Date of birth" : "Age"}
            value={canManage ? a.date_of_birth : age?.toString()}
          />
          <Row label="Home city" value={a.home_city} />
          <Row label="Profile ID" value={`/athletes/${a.slug}`} />
        </dl>
      </Panel>
      {claimed &&
        detail.contact &&
        (detail.contact.contact_phone || detail.contact.contact_email) && (
          <Panel
            title="Contact"
            description="Shared by the athlete with approved teams, leagues and scouts. Please use it only to discuss playing opportunities."
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row
                label="Phone / WhatsApp"
                value={detail.contact.contact_phone}
              />
              <Row label="Email" value={detail.contact.contact_email} />
            </dl>
          </Panel>
        )}

      {!claimed && canManage && (
        <InvitePanel athleteId={id} invitation={detail.invitation} />
      )}

      <Panel
        title="Teams"
        description="Jersey numbers and positions per tournament will show here once rosters exist."
      >
        {detail.teamMemberships.length === 0 ? (
          <p className="text-sm text-zs-muted">Not on any team yet.</p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {detail.teamMemberships.map((m) => (
              <li
                key={m.teamId}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
              >
                <span className="font-display text-lg font-bold text-zs-ink">
                  {m.teamName}
                </span>
                <span className="font-data text-xs text-zs-muted">
                  {m.status === "active"
                    ? `Member since ${fmtDate(m.joinedAt)}`
                    : `Left ${m.leftAt ? fmtDate(m.leftAt) : ""}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Tournament rosters"
        description="Jersey and position per tournament."
      >
        {rosters.length === 0 ? (
          <p className="text-sm text-zs-muted">
            Not on any tournament roster yet.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {rosters.map((r) => (
              <li
                key={`${r.tournament_id}-${r.team_id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
              >
                <span>
                  <span className="font-display text-lg font-bold text-zs-ink">
                    {r.tournament_name}
                  </span>
                  <span className="ml-2 font-data text-xs text-zs-muted">
                    {r.team_name} · {r.league_name} · {fmtDay(r.start_date)}
                  </span>
                </span>
                <span className="font-data text-xs text-zs-muted">
                  #{r.jersey_number} · {r.position} ·{" "}
                  {r.status === "accepted" ? "Accepted" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {!claimed && canManage && <UnclaimedDangerZone athleteId={id} />}
    </div>
  );
}
