import { dataFont, displayFont } from "@/components/fonts";
import { cn } from "@/utils/cn";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        "min-h-dvh bg-zs-bg text-zs-ink",
      )}
    >
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
