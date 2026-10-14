import Link from "next/link";

import { BrandText } from "@/components/brand-text";
import { FOOTER_SECTIONS, SOCIAL_LINKS } from "./footer.constants";

export function SiteFooter() {
  return (
    <footer className="bg-transparent text-white lg:px-24 lg:py-14 px-6 py-5">
      <div className="mx-auto max-w-8xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <BrandText href="/" />
            <p className="max-w-sm text-sm text-muted-foreground">
              The verified career record for African flag football: every stat,
              every league, one record.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-lime hover:text-brand-violet-ink"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4 col-span-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {section.title}
              </p>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-muted pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} FlagStats. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
