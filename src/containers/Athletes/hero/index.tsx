import { BadgeCheckIcon } from "@/components/icons";
import { getAthleteDirectoryStats } from "@/features/athletes/actions/athlete-public.actions";

export async function AthletePageHero() {
  const stats = await getAthleteDirectoryStats();
  return (
    <section
      id="top"
      className="relative flex flex-col gap-2 justify-center items-center min-h-[45vh] md:min-h-[60vh] w-full bg-black/20 px-6 lg:px-52"
    >
      <div className="max-w-6xl w-full flex flex-col gap-2">
        <div className="flex gap-1.5 font-data text-xs uppercase tracking-wider text-accent-gold rounded-lg border border-white/10 bg-accent-gold/10 px-3 py-2 backdrop-blur-sm w-fit">
          <BadgeCheckIcon
            className="shrink-0 text-transparent w-3.5 h-3.5"
            stroke="#ff5e00"
          />
          <span>African federation registry</span>
        </div>

        <div className="flex flex-col">
          <h2 className="max-w-4xl uppercase text-[24px] md:text-[48px] font-sans font-semibold md:leading-13 tracking-[-.07em] text-white">
            Verified Athletes
          </h2>
          <h1 className="max-w-4xl uppercase text-accent text-[24px] md:text-[48px] font-black font-sans md:leading-13 tracking-[-.07em]">
            Directory
          </h1>

          <p className="mt-4 max-w-2xl text-[14px] md:text-[16px] font-sans font-regular leading-4 md:leading-6 text-slate-300 sm:text-base">
            Career records across African flag football clubs, leagues, and
            federations.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total athletes", value: stats.totalAthletes },
            { label: "Teams registered", value: stats.teamsRegistered },
            { label: "Total Leagues", value: stats.leaguesRegistered },
            { label: "Verified rate", value: `${stats.verifiedRate}%` },
            { label: "Active nations", value: stats.activeNations },
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
