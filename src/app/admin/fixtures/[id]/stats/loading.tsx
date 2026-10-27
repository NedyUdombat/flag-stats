export default function FixtureStatsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-4 w-36 bg-zs-line" />

      <section className="space-y-4 border border-zs-line bg-zs-panel p-6">
        <div className="h-3 w-48 bg-zs-line" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="h-8 max-w-56 bg-zs-line" />
          <div className="h-4 w-8 bg-zs-line" />
          <div className="ml-auto h-8 w-full max-w-56 bg-zs-line" />
        </div>
      </section>

      <section className="space-y-4 border border-zs-line bg-zs-panel p-6">
        <div className="h-6 w-48 bg-zs-line" />
        <div className="h-4 w-3/4 bg-zs-line" />
        <div className="h-11 w-48 bg-zs-line" />
      </section>

      {[1, 2].map((team) => (
        <section
          key={team}
          className="space-y-4 border border-zs-line bg-zs-panel p-5"
        >
          <div className="h-6 w-40 bg-zs-line" />
          {[1, 2, 3].map((player) => (
            <div key={player} className="h-16 border border-zs-line bg-zs-bg" />
          ))}
        </section>
      ))}
    </div>
  );
}
