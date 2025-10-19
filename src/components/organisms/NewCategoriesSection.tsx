import { CategoryItem } from "@/components/molecules/CategoryItem";

interface CategoriesSectionProps {
  title: string;
  categories: {
    title: string;
    icon: string;
    bgColor: string;
  }[];
}

export function CategoriesSection({ title, categories }: CategoriesSectionProps) {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <CategoryItem
              key={index}
              title={category.title}
              icon={category.icon}
              bgColor={category.bgColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}