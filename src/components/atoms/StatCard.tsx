import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/common/metric-card";

interface StatCardProps {
  number: string;
  label: string;
  className?: string;
}

export function StatCard({ number, label, className }: StatCardProps) {
  return (
    <MetricCard
      label={label}
      value={number}
      tone="accent"
      className={cn("text-left", className)}
    />
  );
}
