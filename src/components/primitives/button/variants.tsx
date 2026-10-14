import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Shared base styles for all buttons
  "inline-flex items-center justify-center font-semibold tracking-wider transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-gold)] text-[var(--neutral-black)] shadow-xs hover:bg-[var(--accent-gold)]/90 active:bg-[var(--accent-gold)]/80",
        accent:
          "bg-[var(--neutral-black)] text-[var(--accent-gold)] shadow-xs border border-white/10 hover:bg-black/80 hover:text-[var(--accent-gold)]/90 active:bg-black",
        secondary:
          "bg-[var(--neutral-gray-1)] text-[var(--neutral-white)] shadow-xs hover:bg-[var(--neutral-gray-1)]/80 active:bg-[var(--neutral-gray-1)]/70",
        tertiary:
          "bg-transparent text-foreground hover:bg-[var(--neutral-gray-1)]/50 active:bg-[var(--neutral-gray-1)]/80",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
        info: "bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700",
        transparent:
          "bg-transparent text-current border border-transparent hover:bg-white/5 active:bg-white/10",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-[var(--accent-gold)] underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        xs: "h-8 px-3 text-xs gap-1.5",
        sm: "h-9 px-4 text-sm gap-2",
        default: "h-10 px-5 text-base gap-2",
        lg: "h-11 px-6 text-lg gap-2.5",
        xl: "h-12 px-8 text-xl gap-3",
        icon: "h-10 w-10 p-0 justify-center",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "sm",
    },
  },
);
