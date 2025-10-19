import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  return (
    <div className={cn(
      "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
      className
    )}>
      {icon}
    </div>
  );
}