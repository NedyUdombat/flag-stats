import { dataFont, displayFont, dmSansFont } from "@/components/fonts";
import { cn } from "@/utils/cn";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        dmSansFont.variable,
        "min-h-dvh",
        "pt-30 dark relative overflow-hidden bg-neutral-black px-4 py-16 text-foreground sm:px-6",
      )}
    >
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
