import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, size = "md", variant = "primary", children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          "rounded-lg font-medium shadow-none",
          {
            "h-8 px-4 text-sm": size === "sm",
            "h-10 px-6 text-base": size === "md",
            "h-12 px-8 text-lg": size === "lg",
          },
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted": variant === "outline",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";

export { PrimaryButton };
