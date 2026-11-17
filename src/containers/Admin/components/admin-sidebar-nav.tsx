"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils/cn";

export interface RenderedNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const DASHBOARD_HREF = "/admin";

function isActive(pathname: string, href: string) {
  if (href === DASHBOARD_HREF) return pathname === DASHBOARD_HREF;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({
  items,
  onNavigate,
}: {
  items: RenderedNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul className="flex flex-col gap-2">
        {items.map(({ href, label, icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="cursor-pointer">
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-4 py-2.5 font-sans text-[15px] font-normal tracking-wider ",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold",
                  "[&_svg]:size-4 [&_svg]:shrink-0 rounded-sm",
                  active
                    ? "bg-accent-gold text-zs-lime-ink"
                    : "text-zs-muted hover:bg-zs-raised hover:text-zs-ink",
                )}
              >
                {icon}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
