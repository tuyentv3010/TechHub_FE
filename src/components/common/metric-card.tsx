import * as React from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppSurface } from "@/components/common/app-surface";

type MetricTone = "default" | "primary" | "accent" | "warning" | "danger";

const toneClasses: Record<MetricTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-[hsl(var(--learning-accent)/0.12)] text-[hsl(var(--learning-accent))]",
  warning: "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
  danger: "bg-destructive/10 text-destructive",
};

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  trend?: React.ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
}

export function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  tone = "default",
  className,
  ...props
}: MetricCardProps) {
  return (
    <AppSurface
      as="div"
      padding="md"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
        {trend ? <div className="text-sm text-muted-foreground">{trend}</div> : null}
      </div>
      {Icon ? (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </AppSurface>
  );
}
