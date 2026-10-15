import { cn } from "@/utils/cn";

export function TeamLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  size?: "md" | "lg";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border border-zs-line bg-zs-raised bg-cover bg-center font-display font-bold text-zs-muted",
        size === "lg" ? "size-20 text-2xl" : "size-10 text-sm",
      )}
      style={
        logoUrl
          ? { backgroundImage: `url("${logoUrl.replace(/"/g, "%22")}")` }
          : undefined
      }
    >
      {logoUrl ? null : initials}
    </span>
  );
}
