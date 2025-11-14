import { cn } from "@/lib/utils";

interface StatCardProps {
  number: string;
  label: string;
  className?: string;
}

export function StatCard({ number, label, className }: StatCardProps) {
  return (
    <div className={cn(
      "text-center p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg text-white",
      className
    )}>
      <div className="text-2xl font-bold">{number}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}