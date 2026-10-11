import Link from "next/link";

interface BrandTextProps {
  href?: string;
  showProBadge?: boolean;
}

export function BrandText({ href, showProBadge }: BrandTextProps) {
  return (
    <Link
      href={href || "/"}
      className="inline-flex items-center gap-2 group transition-opacity hover:opacity-90"
    >
      <span className="flex size-6 items-center justify-center rounded bg-brand-lime font-display text-[11px] font-black text-brand-ink shadow-sm">
        F
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-xl font-black tracking-tight text-white ">
          FLAG<span className="text-zs-lime">STATS</span>
        </span>

        {showProBadge && (
          <span className="rounded bg-zs-muted/20 px-1.5 py-0.5 font-data text-[10px] font-semibold tracking-widest text-white uppercase">
            PRO
          </span>
        )}
      </div>
    </Link>
  );
}
