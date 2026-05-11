import * as React from "react";

import { cn } from "@/lib/utils";

type AppSurfaceVariant = "default" | "subtle" | "elevated" | "flat";
type AppSurfacePadding = "none" | "sm" | "md" | "lg";

const variantClasses: Record<AppSurfaceVariant, string> = {
  default: "border border-border bg-card text-card-foreground shadow-sm",
  subtle: "border border-border bg-muted/35 text-foreground",
  elevated: "border border-border bg-card text-card-foreground shadow-md",
  flat: "border border-border bg-card text-card-foreground shadow-none",
};

const paddingClasses: Record<AppSurfacePadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export interface AppSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "article" | "div" | "aside";
  variant?: AppSurfaceVariant;
  padding?: AppSurfacePadding;
}

export function AppSurface({
  as: Comp = "section",
  variant = "default",
  padding = "md",
  className,
  ...props
}: AppSurfaceProps) {
  return (
    <Comp
      className={cn(
        "rounded-xl",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}
