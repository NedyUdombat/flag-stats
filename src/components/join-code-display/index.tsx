"use client";

import { useState } from "react";

export function JoinCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono font-bold text-zs-ink">{code}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs text-zs-lime hover:underline uppercase font-data cursor-pointer"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
