import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import LearningPathDetail from "./learning-path-detail";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("LearningPathDetail");
  
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <LearningPathDetail pathId={id} />
      </Suspense>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-8">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
