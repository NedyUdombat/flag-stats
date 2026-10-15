import { ShieldIcon } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import type { LeagueDirectoryItem } from "@/features/leagues/actions/league-public.actions";
import { LeagueDirectoryCard } from "../league-directory-card";

interface LeagueDirectoryProps {
  result: {
    leagues: LeagueDirectoryItem[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  verifiedOnly?: boolean;
  q?: string | undefined;
  country?: string | undefined;
  sort: string;
}

export async function LeagueDirectory({
  result,
  verifiedOnly,
  q,
  country,
  sort,
}: LeagueDirectoryProps) {
  const pageSize = 12;

  return (
    <section
      id="league-directory"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-3">
        <div className="flex items-end justify-end font-data text-[12px] text-white uppercase">
          <span>{result.totalCount} records</span>
        </div>

        {result.leagues.length === 0 ? (
          <EmptyState
            icon={ShieldIcon}
            title="No leagues found"
            description="Try a different search or filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.leagues.map((league) => (
              <LeagueDirectoryCard key={league.id} league={league} />
            ))}
          </div>
        )}
        <div className="mt-2">
          <Pagination
            page={result.currentPage}
            pageSize={pageSize}
            total={result.totalCount}
            buildHref={(p) => {
              const sp = new URLSearchParams();
              if (q) sp.set("q", q);
              if (country && country !== "all") sp.set("country", country);
              if (verifiedOnly) sp.set("verifiedOnly", "true");
              if (sort && sort !== "most_recently_verified")
                sp.set("sort", sort);
              sp.set("page", String(p));
              return `/leagues?${sp.toString()}`;
            }}
          />
        </div>
      </div>
    </section>
  );
}
