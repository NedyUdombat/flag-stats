export function Metrics() {
  return (
    <section
      id="metrics"
      className="bg-neutral-black py-4 px-8 md:py-16 md:px-40 grid grid-cols-2 sm:grid-cols-4"
    >
      {[
        ["2", "Countries onboarded"],
        ["7", "Verified athletes"],
        ["5", "Teams registered"],
        ["11", "Stat events logged"],
      ].map(([value, label]) => (
        <div
          key={label}
          className="border-neutral-gray-1 text-center first:border-0 sm:border-l"
        >
          <div className="text-[64px] font-black tracking-[-4px] text-accent-gold font-sans">
            {value}
          </div>

          <div className="mt-1 text-[14px] uppercase tracking-[.12em] text-neutral-gray-2 font-data">
            {label}
          </div>
        </div>
      ))}
    </section>
  );
}
