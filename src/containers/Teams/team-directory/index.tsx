import { ShieldIcon } from "lucide-react"; // Or your preferred team icon
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import type { PublicTeamListItem } from "@/features/teams/actions/team-public.actions";
import { TeamDirectoryCard } from "../team-directory-card"; // Adjust import path as needed

interface TeamDirectoryProps {
  result: {
    teams: PublicTeamListItem[];
    page: number;
    pageSize: number;
    total: number;
  };
  verifiedOnly?: boolean;
  q?: string | undefined;
  country?: string | undefined;
  sort: string;
}

export async function TeamDirectory({
  result,
  verifiedOnly,
  q,
  country,
  sort,
}: TeamDirectoryProps) {
  return (
    <section
      id="team-directory"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-3">
        <div className="flex items-end justify-end font-data text-[12px] text-white uppercase">
          <span>{result.total} records</span>
        </div>

        {result.teams.length === 0 ? (
          <EmptyState
            icon={ShieldIcon}
            title="No teams found"
            description="Try a different search or filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.teams.map((team) => (
              <TeamDirectoryCard key={team.id} team={team} />
            ))}
          </div>
        )}
        <div className="mt-2">
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            buildHref={(p) => {
              const sp = new URLSearchParams();
              if (q) sp.set("q", q);
              if (country && country !== "all") sp.set("country", country);
              if (verifiedOnly) sp.set("verifiedOnly", "true");
              if (sort && sort !== "most_recently_verified")
                sp.set("sort", sort);
              sp.set("page", String(p));
              return `/teams?${sp.toString()}`;
            }}
          />
        </div>
      </div>
    </section>
  );
}
