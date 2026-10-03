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
        "flex w-full items-center gap-3 px-4 py-2.5 font-display text-[15px] font-semibold tracking-wider text-zs-coral uppercase",
        "hover:bg-zs-coral/10 hover:text-zs-coral disabled:opacity-60",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime font-bold",
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
