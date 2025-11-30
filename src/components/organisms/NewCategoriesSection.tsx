"use client";

import { useGetSkills } from "@/queries/useCourse";
import Link from "next/link";
import Image from "next/image";

// Re-export OrbitCategoriesSection for convenience
export { OrbitCategoriesSection } from "./OrbitCategoriesSection";

interface CategoriesSectionProps {
  title: string;
  variant?: "grid" | "orbit";
}

export function CategoriesSection({ title, variant = "grid" }: CategoriesSectionProps) {
  // If orbit variant is requested, dynamically import and render it
  if (variant === "orbit") {
    const OrbitCategoriesSection = require("./OrbitCategoriesSection").OrbitCategoriesSection;
    return <OrbitCategoriesSection title={title} />;
  }

  return <GridCategoriesSection title={title} />;
}

function GridCategoriesSection({ title }: { title: string }) {
  const { data: skillsData, isLoading } = useGetSkills();
  const skills = skillsData?.payload?.data ?? [];

  if (isLoading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <div className="mt-3 w-20 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {skills.slice(0, 16).map((skill: any) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group border dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                {skill.thumbnail ? (
                  <Image
                    src={skill.thumbnail}
                    alt={skill.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {skill.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-medium text-center text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                {skill.name}
              </h3>
              {skill.category && (
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {skill.category.toLowerCase()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}