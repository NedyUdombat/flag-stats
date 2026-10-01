import Link from "next/link";

import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/social-icons";

const PLATFORM_LINKS = [
  { href: "/athletes", label: "Athletes" },
  { href: "/teams", label: "Teams" },
  { href: "/leagues", label: "Leagues" },
  { href: "/organizations", label: "Federations" },
  { href: "/standings", label: "Standings" },
  { href: "/blog", label: "Blog" },
];

const COMPANY_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/sign-up", label: "Sign up" },
  { href: "/login", label: "Sign in" },
  { href: "/cookies-policy", label: "Cookies Policy" },
];

const SOCIAL_LINKS = [
  { href: "", label: "X (Twitter)", icon: XIcon },
  {
    href: "",
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: "",
    label: "Facebook",
    icon: FacebookIcon,
  },
  {
    href: "",
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-violet-deep text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="font-display text-lg tracking-tight">
              ZEDY<span className="text-brand-lime">Stats</span>
            </Link>
            <p className="max-w-sm text-sm text-white/60">
              The verified career record for African flag football — every stat,
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

          <div>
            <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
              Platform
            </p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
              {PLATFORM_LINKS.map((link) => (
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

          <div>
            <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
              Company
            </p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
              {COMPANY_LINKS.map((link) => (
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
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <span>
            © {new Date().getFullYear()} ZedyStats. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
