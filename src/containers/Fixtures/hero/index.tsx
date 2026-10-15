import { CalendarIcon } from "@/components/icons";
import { getFixturesHeroStats } from "@/features/fixtures/fixtures-public.service";

export async function FixturesHero() {
  const stats = await getFixturesHeroStats();

  return (
    <section
      id="fixtures-hero"
      className="relative flex flex-col gap-2 justify-center items-center min-h-[45vh] md:min-h-[60vh] w-full bg-black/20 px-6 lg:px-52"
    >
      <div className="max-w-6xl w-full flex flex-col gap-2">
        <div className="flex gap-1.5 font-data text-xs uppercase tracking-wider text-accent-gold rounded-lg border border-white/10 bg-accent-gold/10 px-3 py-2 backdrop-blur-sm w-fit">
          <CalendarIcon
            className="shrink-0 text-transparent w-3.5 h-3.5"
            stroke="#ff5e00"
          />
          <span>Tournament Calendar</span>
        </div>

        <div className="flex flex-col">
          <h2 className="max-w-4xl uppercase text-[24px] md:text-[48px] font-sans font-semibold md:leading-13 tracking-[-.07em] text-white">
            Sanctioned Games
          </h2>
          <h1 className="max-w-4xl uppercase text-accent text-[24px] md:text-[48px] font-black font-sans md:leading-13 tracking-[-.07em]">
            Fixtures & Calendar
          </h1>

          <p className="mt-4 max-w-2xl text-[14px] md:text-[16px] font-sans font-regular leading-4 md:leading-6 text-slate-300 sm:text-base">
            Every scheduled fixture, live match broadcast, and completed result
            across flag football circuits on the platform.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Scheduled Fixtures", value: stats.scheduledCount },
            { label: "Total Matches", value: stats.totalFixtures },
            { label: "Active Circuits", value: stats.activeTournaments },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-neutral-covert p-4 text-center"
            >
              <p className="text-[36px] font-black tracking-[-4px] text-accent-gold font-sans">
                {s.value}
              </p>
              <p className="mt-1 text-[12px] uppercase tracking-[.12em] text-white/80 font-data">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
