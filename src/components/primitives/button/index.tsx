import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/utils/cn";
import { buttonVariants } from "./variants";

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      children,
      disabled: propsDisabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const disabled = isDisabled || isLoading || propsDisabled;

    return (
      <Comp
        ref={ref}
        data-slot="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size, className }),
          "font-semibold tracking-wider cursor-pointer",
          fullWidth && "w-full",
          isLoading && "relative transition-none",
          disabled && "cursor-not-allowed pointer-events-none opacity-50",
        )}
        {...props}
      >
        <div className="relative flex items-center gap-2">
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="animate-spin text-current" size={20} />
            </span>
          )}
          {leftIcon && !iconOnly && !isLoading && (
            <span className="inline-flex shrink-0">{leftIcon}</span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-2",
              isLoading && "opacity-0",
            )}
          >
            {!iconOnly && children}
            {iconOnly && children}
          </span>
          {rightIcon && !iconOnly && !isLoading && (
            <span className="inline-flex shrink-0">{rightIcon}</span>
          )}
        </div>
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
