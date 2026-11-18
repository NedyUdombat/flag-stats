import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border p-5 sm:p-6 rounded-lg">
      {title && (
        <h2 className="font-sans text-xl font-semibold tracking-wide text-zs-ink uppercase">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-zs-muted font-sans">{description}</p>
      )}
      <div className={!title && !description ? "" : "mt-5"}>{children}</div>
    </section>
  );
}
