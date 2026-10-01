import Link from "next/link";

export function AuthBrand() {
  return (
    <Link
      href="/"
      className="mx-auto flex w-fit items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-lime"
    >
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-md bg-background font-display text-2xl leading-none text-brand-lime"
      >
        Z
      </span>
      <span className="font-display text-2xl leading-none uppercase tracking-wide">
        Zedy<span className="text-brand-lime">Stats</span>
      </span>
    </Link>
  );
}
