import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CircleCheckIcon : TriangleAlertIcon;
  return (
    <p
      // role="status"
      className={cn(
        "flex items-center gap-2 border px-4 py-3 text-sm",
        tone === "ok"
          ? "border-zs-lime/40 bg-zs-lime/10 text-zs-lime"
          : "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
