"use client";

import Image from "next/image";
import Link from "next/link";

import { AppSurface, PageHeader } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSkills } from "@/queries/useCourse";
import { OrbitCategoriesSection } from "./OrbitCategoriesSection";

export { OrbitCategoriesSection };

interface CategoriesSectionProps {
  title: string;
  variant?: "grid" | "orbit";
}

export function CategoriesSection({ title, variant = "grid" }: CategoriesSectionProps) {
  if (variant === "orbit") {
    return <OrbitCategoriesSection title={title} />;
  }

  return <GridCategoriesSection title={title} />;
}

function GridCategoriesSection({ title }: { title: string }) {
  const { data: skillsData, isLoading } = useGetSkills();
  const skills = skillsData?.payload?.data ?? [];

  if (isLoading) {
    return (
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <PageHeader
            eyebrow="Course categories"
            title={title}
            className="mb-10 text-center sm:items-center"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <AppSurface key={index} padding="md" className="text-center">
                <Skeleton className="mx-auto mb-3 h-14 w-14 rounded-lg" />
                <Skeleton className="mx-auto h-4 w-20" />
              </AppSurface>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (skills.length === 0) return null;

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          eyebrow="Course categories"
          title={title}
          description="Browse the core skill areas that power TechHub courses and learning paths."
          className="mx-auto mb-10 max-w-3xl text-center sm:items-center"
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {skills.slice(0, 16).map((skill: any) => (
            <Link key={skill.id} href={`/skills/${skill.id}`} className="group block">
              <AppSurface
                padding="md"
                className="h-full text-center transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {skill.thumbnail ? (
                    <Image
                      src={skill.thumbnail}
                      alt={skill.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">
                      {skill.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-medium text-foreground">
                  {skill.name}
                </h3>
                {skill.category ? (
                  <span className="mt-1 block text-xs capitalize text-muted-foreground">
                    {skill.category.toLowerCase()}
                  </span>
                ) : null}
              </AppSurface>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
