"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandText } from "@/components/brand-text";
import { SignOutButton } from "@/components/logout-button";
import { AdminSidebarNav, type RenderedNavItem } from "./admin-sidebar-nav";

interface AdminSidebarProps {
  items: RenderedNavItem[];
}

export function AdminSidebar({ items }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);

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
        <div className="border-b border-zs-line px-6 py-3 h-16 flex items-center">
          <BrandText showProBadge href="/admin" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <AdminSidebarNav items={items} />
        </div>
        <div className="border-t border-zs-line  p-2 h-16">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zs-line bg-zs-panel px-6 py-3 lg:hidden h-16">
        <BrandText showProBadge href="/admin" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="p-2 text-zs-ink focus-visible:outline-2 focus-visible:outline-zs-lime cursor-pointer"
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
            <div className="flex items-center justify-between border-b border-zs-line px-6 py-3 h-16">
              <BrandText showProBadge href="/admin" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="p-2 cursor-pointer text-zs-muted hover:text-zs-ink focus-visible:outline-2 focus-visible:outline-zs-lime"
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
            <div className="border-t border-zs-line p-2 h-16">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
