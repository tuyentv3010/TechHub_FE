import { Suspense } from "react";
import LearningPathList from "./learning-path-list";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LearningPathsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <LearningPathList />
      </Suspense>
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
