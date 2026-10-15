import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../primitives/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}

export function Pagination({
  page,
  pageSize,
  total,
  buildHref,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page <strong>{page}</strong> of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          leftIcon={<ChevronLeftIcon className="size-4" />}
        >
          <Link
            href={buildHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className="cursor-pointer font-data font-medium"
          >
            Previous
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={
            page >= totalPages ? "pointer-events-none opacity-50" : undefined
          }
          rightIcon={<ChevronRightIcon className="size-4" />}
        >
          <Link
            href={buildHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className="cursor-pointer font-data font-medium"
          >
            Next
          </Link>
        </Button>
      </div>
    </div>
  );
}
