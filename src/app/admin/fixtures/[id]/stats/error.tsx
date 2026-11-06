"use client";

export default function FixtureStatsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl space-y-4 border border-zs-line bg-zs-panel p-6">
      <p className="font-data text-xs uppercase tracking-wider text-zs-muted">
        Fixture statistics
      </p>

      <h1 className="font-display text-2xl font-bold uppercase text-zs-ink">
        Could not load fixture statistics
      </h1>

      <p className="text-sm leading-6 text-zs-muted">
        Something went wrong while loading this fixture&apos;s statistics. Try
        again. If the problem continues, check the server logs.
      </p>

      {process.env.NODE_ENV === "development" && (
        <p className="break-words text-xs text-red-600">{error.message}</p>
      )}

      <button
        type="button"
        onClick={reset}
        className="min-h-10 border border-zs-ink bg-zs-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Try again
      </button>
    </section>
  );
}
