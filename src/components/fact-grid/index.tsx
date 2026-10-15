export interface Fact {
  label: string;
  value: React.ReactNode;
  hint?: string | null;
}

export function FactGrid({
  facts,
  title,
  className,
}: {
  facts: (Fact | null | false)[];
  title?: string;
  className?: string;
}) {
  const shown = facts.filter(
    (f): f is Fact =>
      !!f && f.value !== null && f.value !== undefined && f.value !== "",
  );
  if (shown.length === 0) return null;

  return (
    <section className={className} aria-label={title}>
      {title ? (
        <p className="mb-3 font-data text-[12px] tracking-wide text-brand-lime uppercase">
          {title}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((f) => (
          <div key={f.label} className="min-w-0 bg-background p-4">
            <dt className="font-data text-[10px] tracking-wide text-white/40 uppercase">
              {f.label}
            </dt>
            <dd className="mt-1 font-data text-sm wrap-break-word text-white">
              {f.value}
              {f.hint ? (
                <span className="block text-[10px] text-white/40">
                  {f.hint}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
