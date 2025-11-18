import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import LearningPathList from "./learning-path-list";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LearningPathsPage() {
  const t = await getTranslations("LearningPaths");
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("heroDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Learning Paths Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <Suspense fallback={<LoadingSkeleton />}>
            <LearningPathList />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
