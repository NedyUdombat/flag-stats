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
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black tracking-[-1.5px] text-accent-gold">
          Flag<span className="text-white">Stats</span>
        </span>

        {showProBadge && (
          <span className="rounded bg-[#FFB703] px-1 py-0.5 text-[#0B1019] text-[8px] font-bold tracking-widest uppercase">
            PRO
          </span>
        )}
      </div>
    </Link>
  );
}
