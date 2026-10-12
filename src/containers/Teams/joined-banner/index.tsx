"use client";

import { useSearchParams } from "next/navigation";

export function JoinedBanner() {
  if (useSearchParams().get("joined") !== "1") return null;
  return (
    <p
      role="status"
      className="border border-zs-lime/40 bg-zs-lime/10 px-4 py-3 text-sm text-zs-lime"
    >
      You joined the team. You&apos;re now in its athlete pool, and you can
      leave any time below.
    </p>
  );
}
