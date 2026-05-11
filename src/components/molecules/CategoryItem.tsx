import { CategoryIcon } from "@/components/atoms/CategoryIcon";

interface CategoryItemProps {
  title: string;
  icon: string;
  bgColor: string;
}

export function CategoryItem({ title, icon, bgColor }: CategoryItemProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group border dark:border-gray-700">
      <CategoryIcon 
        icon={icon} 
        className={`${bgColor} group-hover:scale-110 transition-transform`} 
      />
      <h3 className="mt-3 text-center text-sm font-medium text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>
    </div>
  );
}
