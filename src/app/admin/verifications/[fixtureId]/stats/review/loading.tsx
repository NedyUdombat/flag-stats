export default function StatsReviewLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="h-5 w-48 animate-pulse bg-zs-raised" />
      <div className="h-48 animate-pulse border border-zs-line bg-zs-panel" />
      <div className="h-64 animate-pulse border border-zs-line bg-zs-panel" />
      <div className="h-64 animate-pulse border border-zs-line bg-zs-panel" />
    </div>
  );
}
