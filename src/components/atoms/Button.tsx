"use client";
import React from "react";
import { Button as UiButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "pill";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "border border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
  pill: "rounded-lg border border-border bg-card text-foreground shadow-sm hover:bg-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 h-8",
  md: "text-sm px-4 h-10",
  lg: "text-base px-6 h-12",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, ...rest }, ref
) {
  return (
    <UiButton
      ref={ref}
      variant="default"
      className={cn(
        "rounded-lg font-medium shadow-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    />
  );
});

export default Button;

