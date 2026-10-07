"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/logout-buttom";
import { AdminSidebarNav, type RenderedNavItem } from "./admin-sidebar-nav";

// import { SignOutButton } from "./sign-out-button";

function Brand() {
  return (
    <Link
      href="/admin/dashboard"
      className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zs-lime"
    >
      <span className="font-display text-3xl leading-none font-bold text-zs-lime">
        Z
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-wide text-zs-ink">
          ZEDI<span className="text-zs-lime">STATS</span>
        </span>
        <span className="mt-1 font-data text-[10px] tracking-[0.2em] text-zs-muted">
          PRO PLATFORM
        </span>
      </span>
    </Link>
  );
}

/** Items arrive pre-filtered and pre-rendered from the server (AdminShell). */
export function AdminSidebar({ items }: { items: RenderedNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-zs-line bg-zs-panel lg:flex">
        <div className="border-b border-zs-line px-6 py-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <AdminSidebarNav items={items} />
        </div>
        <div className="border-t border-zs-line px-3 py-4">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zs-line bg-zs-panel px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="p-2 text-zs-ink focus-visible:outline-2 focus-visible:outline-zs-lime"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-zs-panel">
            <div className="flex items-center justify-between border-b border-zs-line px-5 py-5">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="p-2 text-zs-muted hover:text-zs-ink focus-visible:outline-2 focus-visible:outline-zs-lime"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <AdminSidebarNav
                items={items}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t border-zs-line px-3 py-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
