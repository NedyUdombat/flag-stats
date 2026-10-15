"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function AthletePassportActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-sm border border-white/10 px-4 py-2 font-mono text-[10px] tracking-wide text-white/70 uppercase hover:border-brand-lime hover:text-brand-lime"
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
