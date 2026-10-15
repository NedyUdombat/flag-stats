import Image from "next/image";
import { BadgeCheckIcon, ShieldCheckIcon } from "@/components/icons";
import { HeroSearch } from "./hero-search";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[65vh] md:min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden pt-32 lg:px-8 lg:pb-20 lg:pt-40 bg-neutral-black py-4 px-8 md:py-16 md:px-40"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.png"
          alt="Football background"
          fill
          priority
          className="object-cover object-op-right opacity-80"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0b1019]/70 via-[#0b1019]/50 to-[#0b1019]" />
      </div>

      <div className="relative z-10 mx-auto my-auto md:mt-auto md:mb-0 max-w-5xl text-center flex flex-col gap-6">
        <div className="mx-auto flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-accent-gold/10 p-2 backdrop-blur-sm sm:inline-flex sm:flex-row sm:gap-3 sm:rounded-lg sm:p-1">
          <div className="flex items-center gap-1.5 px-1.5 py-1 font-data text-xs uppercase tracking-wider text-accent-gold">
            <ShieldCheckIcon
              className="shrink-0 text-transparent w-3.5 h-3.5"
              stroke="#FF5E00"
            />
            <span>Multi-federation verified</span>
          </div>

          <div
            className="h-px w-full bg-white/15 sm:h-3.5 sm:w-px sm:bg-white/25"
            aria-hidden="true"
          />

          <div className="flex items-center gap-1.5 px-1.5 py-1 font-data text-xs uppercase tracking-wider text-accent-gold">
            <BadgeCheckIcon
              className="shrink-0 text-transparent w-3.5 h-3.5"
              stroke="#ff5e00"
            />
            <span>Official career passport system</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mx-auto max-w-4xl text-[24px] md:text-[64px] font-sans font-semibold md:leading-14 tracking-[-.07em] text-white">
              Every Stat. Every League.
            </h2>
            <h1 className="mx-auto max-w-4xl text-[24px] md:text-[64px] font-sans font-semibold md:leading-25 tracking-[-.07em] text-white">
              <span className="text-accent text-[48px] md:text-[120px] font-black">
                ONE RECORD.
              </span>
            </h1>
          </div>

          <p className="mx-auto max-w-2xl text-[14px] md:text-[16px] font-sans font-medium leading-4 md:leading-6 text-slate-300 sm:text-base">
            FlagStats tracks verified stats, teams, and leagues that follow an
            athlete across their entire career — no matter how many teams,
            leagues, or countries they play across.
          </p>
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}
