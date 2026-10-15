import { UsersIcon } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import type { PublicAthleteListItem } from "@/features/athletes/actions/athlete-public.actions";
import { AthleteDirectoryCard } from "../athlete-directory-card";

interface AthleteDirectoryProps {
  result: {
    athletes: PublicAthleteListItem[];
    page: number;
    pageSize: number;
    total: number;
  };
  verifiedOnly?: boolean;
  q?: string | undefined;
  position?: string | undefined;
  sort: "most_recently_verified" | "name_asc";
}

export async function AthleteDirectory({
  result,
  verifiedOnly,
  q,
  position,
  sort,
}: AthleteDirectoryProps) {
  return (
    <section
      id="athlete-directory"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-3">
        <div className="flex items-end justify-end font-data text-[12px] text-white uppercase">
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
        <div className="mt-2">
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            buildHref={(p) => {
              const sp = new URLSearchParams();
              if (q) sp.set("q", q);
              if (position) sp.set("position", position);
              if (verifiedOnly) sp.set("verified", "true");
              if (sort !== "most_recently_verified") sp.set("sort", sort);
              sp.set("page", String(p));
              return `/athletes?${sp.toString()}`;
            }}
          />
        </div>
      </div>
    </section>
  );
}
