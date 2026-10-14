import { cn } from "@/utils/cn";

interface SectionBadgeProps {
  icon?: React.ReactNode;
  text: string;
  className?: string;
  textClassName?: string;
}

export function SectionBadge({
  icon,
  text,
  className,
  textClassName,
}: SectionBadgeProps) {
  return (
    <div
      className={cn(
        "bg-neutral-covert flex w-fit items-center gap-2 rounded-sm p-2",
        className,
      )}
    >
      {icon && icon}
      <p
        className={cn(
          "font-data text-[10px] uppercase tracking-[.18em] text-accent",
          textClassName,
        )}
      >
        {text}
      </p>
    </div>
  );
}
