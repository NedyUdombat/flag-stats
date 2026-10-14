import { FeaturedAthletes } from "./featured-athletes";
import { FeaturedStandings } from "./featured-standings";
import { RecentResults } from "./recent-result";

export function FeaturedContainer() {
  return (
    <section
      id="featured"
      className="bg-neutral-black grid lg:grid-cols-[1.2fr_.8fr] gap-8 py-8 px-4 md:py-16 md:px-12 lg:px-24 xl:px-40 overflow-hidden w-full"
    >
      <div className="flex flex-col gap-8 min-w-0">
        <FeaturedStandings />
        <RecentResults />
      </div>
      <div className="min-w-0 w-full">
        <FeaturedAthletes />
      </div>
    </section>
  );
}
