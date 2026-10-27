import Link from "next/link";

type VerificationTabsProps = {
  activeTab: "results" | "stats";
};

const tabs = [
  {
    id: "results",
    label: "Fixture Results",
    href: "/admin/verifications?tab=results",
  },
  {
    id: "stats",
    label: "Player Stats",
    href: "/admin/verifications?tab=stats",
  },
] as const;

export function VerificationTabs({ activeTab }: VerificationTabsProps) {
  return (
    <nav
      aria-label="Verification type"
      className="flex gap-6 border-b border-zs-line"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={[
              "border-b-2 px-1 pb-3 font-display text-sm font-bold uppercase tracking-wider",
              active
                ? "border-zs-lime text-zs-ink"
                : "border-transparent text-zs-muted hover:text-zs-ink",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
