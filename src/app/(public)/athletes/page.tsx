import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { AthleteDirectoryCard } from "@/containers/Athletes/athlete-directory-card";
import { AthleteDirectoryFilters } from "@/containers/Athletes/athlete-directory-filters";
import {
  getAthleteDirectoryStats,
  listAllPublicAthletes,
  listPublicAthletes,
} from "@/features/athletes/actions/athlete-public.actions";
// import { EmptyState } from "@/components/shared/empty-state";
// import { Pagination } from "@/components/shared/pagination";
// import { AthleteDirectoryCard } from "@/features/athletes/components/athlete-directory-card";
// import { AthleteDirectoryFilters } from "@/features/athletes/components/athlete-directory-filters";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthlete } from "@/lib/permissions";
// import {
//   getAthleteDirectoryPage,
//   getAthleteDirectoryStats,
// } from "@/features/athletes/services/athlete-directory.service";
// import { getCurrentUser } from "@/features/users/services/current-user";
// import { canCreateAthlete } from "@/lib/auth/permissions";

export const metadata = { title: "Verified Athletes Directory" };

interface AthletesPageProps {
  searchParams: Promise<{
    q?: string;
    position?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AthletesPage({
  searchParams,
}: AthletesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const verifiedOnly = params.verified === "true";
  const sort = params.sort === "name" ? "name_asc" : "most_recently_verified";

  const [stats, result, user] = await Promise.all([
    getAthleteDirectoryStats(),
    listPublicAthletes({
      q: params.q,
      position: params.position,
      verifiedOnly,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  const canSubmit = canCreateAthlete(user);

  return (
    <div className="dark bg-background min-h-screen pb-16 text-white">
      <section className="border-b border-white/10 bg-black/20 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-2 font-mono text-[11px] tracking-wide text-brand-lime uppercase">
            African federation registry
          </p>
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight uppercase sm:text-5xl">
            Verified athletes
            <br />
            <span className="text-brand-lime">directory.</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/60">
            Career records across African flag football clubs, leagues, and
            federations.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total athletes", value: stats.totalAthletes },
              { label: "Verified rate", value: `${stats.verifiedRate}%` },
              { label: "Active nations", value: stats.activeNations },
              { label: "Teams registered", value: stats.teamsRegistered },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <p className="font-mono text-2xl text-brand-lime">{s.value}</p>
                <p className="mt-1 font-mono text-[10px] text-white/40 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <AthleteDirectoryFilters
          query={params.q}
          position={params.position}
          verifiedOnly={verifiedOnly}
          sort={sort}
        />

        <div className="mt-6 mb-4 flex items-center justify-between font-mono text-[11px] text-white/40 uppercase">
          <span>Verified registry cohort</span>
          <span>{result.total} records</span>
        </div>

        {result.athletes.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No athletes found"
            description="Try a different search or filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.athletes.map((athlete) => (
              <AthleteDirectoryCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            buildHref={(p) => {
              const sp = new URLSearchParams();
              if (params.q) sp.set("q", params.q);
              if (params.position) sp.set("position", params.position);
              if (verifiedOnly) sp.set("verified", "true");
              if (sort !== "most_recently_verified") sp.set("sort", sort);
              sp.set("page", String(p));
              return `/athletes?${sp.toString()}`;
            }}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-lg border-l-2 border-brand-lime bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-display uppercase">
              Federation verification protocol
              <span className="rounded-sm bg-brand-lime/15 px-2 py-0.5 font-mono text-[10px] text-brand-lime">
                Active
              </span>
            </p>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              Every stat shown above is only public once a league admin has
              reviewed and approved it.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/contact"
              className="rounded-sm border border-white/10 px-4 py-2 font-mono text-[10px] tracking-wide text-white/70 uppercase hover:border-brand-lime hover:text-brand-lime"
            >
              Verification standards
            </Link>
            <Link
              href={canSubmit ? "/admin/athletes/new" : "/sign-up"}
              className="rounded-sm bg-brand-lime px-4 py-2 font-mono text-[10px] tracking-wide text-brand-ink uppercase hover:bg-brand-lime/90"
            >
              Submit athlete record
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
