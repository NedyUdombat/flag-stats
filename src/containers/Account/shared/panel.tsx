import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-zs-line bg-zs-panel p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold tracking-wide text-zs-ink uppercase">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-zs-muted">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
