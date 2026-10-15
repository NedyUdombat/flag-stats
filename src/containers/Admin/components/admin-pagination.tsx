import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
  noun?: string;
}

/** 1 … 4 5 6 … 16 — current page ±1, plus first and last. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const box =
  "grid h-9 min-w-9 place-items-center px-2 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-zs-lime";

export function AdminPagination({
  page,
  pageSize,
  total,
  buildHref,
  noun = "results",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-zs-line bg-zs-panel px-4 py-3">
      <p className="text-sm text-zs-muted">
        Showing{" "}
        <span className="text-zs-ink">
          {first}–{last}
        </span>{" "}
        of <span className="text-zs-ink">{total.toLocaleString()}</span> {noun}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <PageLink
            href={buildHref(page - 1)}
            disabled={page <= 1}
            label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </PageLink>
          {pageWindow(page, totalPages).map((p) =>
            p === "gap" ? (
              <span
                key={`gap-${p}`}
                className={cn(box, "text-zs-muted")}
                aria-hidden
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={buildHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  box,
                  p === page
                    ? "bg-zs-lime text-zs-lime-ink"
                    : "text-zs-ink hover:bg-zs-raised",
                )}
              >
                {p}
              </Link>
            ),
          )}
          <PageLink
            href={buildHref(page + 1)}
            disabled={page >= totalPages}
            label="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className={cn(box, "text-zs-line")} aria-hidden>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(box, "text-zs-ink hover:bg-zs-raised")}
    >
      {children}
    </Link>
  );
}
