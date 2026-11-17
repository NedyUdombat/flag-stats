"use client";

import { LogOutIcon } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex w-full rounded-sm items-center gap-3 px-4 py-2.5 font-sans text-[15px] tracking-wider text-red-400  cursor-pointer",
        "hover:bg-red-500/25 hover:text-red-400 disabled:opacity-60",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime font-normal",
        className,
      )}
    >
      <LogOutIcon className="size-4 shrink-0" aria-hidden />
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}

/** A real form posting to a server action, so it works before JS loads too. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <SubmitButton className={className} />
    </form>
  );
}
