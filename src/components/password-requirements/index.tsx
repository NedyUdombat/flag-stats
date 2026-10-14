"use client";

import { CheckIcon } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";
import { cn } from "@/utils/cn";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="space-y-2.5 px-1" aria-label="Password requirements">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-3 text-sm transition-colors",
              met ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors",
                met
                  ? "border-brand-lime bg-brand-lime text-black"
                  : "border-muted-foreground/60",
              )}
            >
              {met ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
            </span>
            {req.label}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
