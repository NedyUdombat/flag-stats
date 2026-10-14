import Image from "next/image";

export function FeatureShowcase() {
  return (
    <section
      id="showcase"
      className="relative overflow-hidden bg-neutral-black py-4 px-8 md:py-16 md:px-40"
    >
      <div className="grid lg:grid-cols-2 w-full max-w-7xl mx-auto p-2 gap-10 bg-neutral-covert rounded-3xl">
        <div className="w-full">
          <Image
            src="/images/showcase.png"
            alt="Football background"
            priority
            className="object-cover object-right rounded-3xl"
            width={550}
            height={880}
          />
        </div>

        <div className="flex flex-col p-10">
          <h2 className="text-[64px] font-bold font-sans leading-none tracking-[-.06em] text-white">
            The Whole Sport,
          </h2>
          <h2 className="text-[64px] font-sans font-bold leading-none tracking-[-4px] text-accent-gold">
            One Record.
          </h2>
          <p className="mt-5 text-base leading-6 tracking-[-.8px] text-neutral-gray-2">
            Everything centered around the athlete's verified record.
          </p>
          <div className="mt-7 flex flex-col gap-6">
            {[
              [
                "Verified Career Records",
                "Every athlete gets one profile that follows them across teams, leagues, and countries — not a stat sheet that disappears when the season ends.",
              ],
              [
                "Live standings",
                "Computed automatically the moment a result is verified. Never entered by hand, never out of date.",
              ],
              [
                "Real verification",
                'A coach submits, a league admin confirms. Nobody verifies their own claim — so the "Verified" badge actually means something.',
              ],
              [
                "Find anyone instantly",
                "Search across every athlete, team, and league on the platform in one place.",
              ],
              [
                "Free Public Pages",
                "Every team, league, and federation gets a shareable FlagStats page — free, forever, no setup required.",
              ],
            ].map(([title, text]) => (
              <div key={title} className="flex flex-col gap-1">
                <h3 className="text-[24px] tracking-[-1.5px] font-semibold font-sans text-white">
                  {title}
                </h3>
                <p className="mt-1 text-base leading-6 tracking-[-.8px] font-sans text-neutral-gray-2">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
