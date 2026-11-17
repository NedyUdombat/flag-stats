import { dataFont, displayFont, dmSansFont } from "@/components/fonts";
import { cn } from "@/utils/cn";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        dmSansFont.variable,
        "relative min-h-dvh overflow-hidden bg-[#0a0d13] px-4 pb-20 pt-28 text-white sm:px-6",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-72 w-full"
      />
      <main className="relative mx-auto max-w-7xl px-1 py-6 sm:px-4 lg:py-10">
        {children}
      </main>
    </div>
  );
}
