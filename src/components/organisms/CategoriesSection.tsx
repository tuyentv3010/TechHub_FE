import { categories } from "@/constants/homeData";
import { CategoryCard } from "@/components/molecules/CategoryCard";

export function CategoriesSection() {
  return (
    <section className="bg-gray-50 py-14 px-6 md:px-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Top Categories</h2>
      <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
        {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
      </div>
    </section>
  );
}

export default CategoriesSection;

