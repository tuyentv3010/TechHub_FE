import Image from "next/image";
import { Category } from "@/types/home";

interface Props { category: Category; }

export function CategoryCard({ category }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 w-44 flex flex-col items-center text-center shadow-sm hover:shadow transition-shadow">
      <Image src={category.icon} alt={category.name} width={48} height={48} />
      <span className="mt-3 text-sm font-medium">{category.name}</span>
    </div>
  );
}

export default CategoryCard;

