import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";
import type { CredentialCard } from "./credentials";

interface CredentialsCardProps {
  card: CredentialCard;
  isActive: boolean;
  setActiveCardId: (id: string) => void;
}

export function CredentialsCard({
  card,
  isActive,
  setActiveCardId,
}: CredentialsCardProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: prefer div here
    <div
      role="region"
      aria-label={card.title}
      key={card.id}
      onMouseEnter={() => setActiveCardId(card.id)}
      className={cn(
        "group relative flex min-h-105 w-full flex-col justify-between overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
        isActive
          ? "border-accent/50 shadow-2xl ring-1 ring-accent-gold/20"
          : "border-white/10 hover:border-white/25",
      )}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={card.imageSrc}
          alt={card.title}
          fill
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-105",
            isActive
              ? "grayscale-0 opacity-80"
              : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-70",
          )}
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0b1019] via-[#0b1019]/60 to-transparent" />
      </div>

      <div className="relative z-10">
        <h3 className="font-sans text-[24px] font-medium tracking-tight text-white">
          {card.title}
        </h3>
      </div>

      <div className="relative z-10 space-y-4 pt-12">
        <p
          className={cn(
            "font-sans text-xs leading-relaxed text-slate-300 transition-opacity duration-300",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {card.description}
        </p>

        <Link
          href={card.ctaHref}
          className={cn(
            "inline-flex items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-accent-gold transition-all hover:underline",
            isActive
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
          )}
        >
          <span>{card.ctaText}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
