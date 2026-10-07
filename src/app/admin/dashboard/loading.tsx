function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse bg-zs-raised motion-reduce:animate-none ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-end justify-between border-b border-zs-line pb-5">
        <div className="space-y-3">
          <Block className="h-4 w-56" />
          <Block className="h-12 w-72" />
        </div>
        <Block className="hidden h-16 w-56 sm:block" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4 bg-zs-panel p-5">
            <Block className="h-4 w-32" />
            <Block className="h-14 w-20" />
            <Block className="h-4 w-44" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4 bg-zs-panel p-5">
          <Block className="h-7 w-80" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="h-36 w-full" />
          ))}
        </div>
        <div className="space-y-2 bg-zs-panel p-5">
          <Block className="mb-4 h-7 w-44" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
