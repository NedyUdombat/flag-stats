"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/utils/cn";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative size-4.5 shrink-0 overflow-hidden rounded-md border border-white/20 bg-neutral-900/60 shadow-xs outline-none transition-all cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-verified-green",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-verified-green! data-[state=checked]:border-verified-green! data-[state=checked]:text-neutral-950!",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-verified-green text-neutral-950",
        )}
      >
        <CheckIcon className="size-3.5 stroke-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
