import { CategoryIcon } from "@/components/atoms/CategoryIcon";

interface CategoryItemProps {
  title: string;
  icon: string;
  bgColor: string;
}

export function CategoryItem({ title, icon, bgColor }: CategoryItemProps) {
  return (
    <div
      className="group th-hover-lift th-focus-ring flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-sm cursor-pointer"
      tabIndex={0}
      role="button"
    >
      <CategoryIcon icon={icon} className={`${bgColor} th-hover-icon`} />
      <h3 className="th-hover-title mt-3 text-center text-sm font-medium text-foreground">
        {title}
      </h3>
    </div>
  );
}
