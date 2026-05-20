"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

import { AppSurface, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import { LearningPathItemType } from "@/schemaValidations/learning-path.schema";

export function LearningPathsSection() {
  const t = useTranslations("HomePage.learningPaths");

  const { data, isLoading } = useGetLearningPathList({
    page: 0,
    size: 4,
    sortBy: "created",
    sortDirection: "DESC",
  });

  const paths = data?.payload?.data || [];

  if (isLoading) {
    return (
      <section className="bg-app-subtle py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <AppSurface key={index} padding="md">
                <Skeleton className="mb-5 h-10 w-10 rounded-lg" />
                <Skeleton className="mb-3 h-5 w-4/5" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </AppSurface>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (paths.length === 0) return null;

  return (
    <section className="bg-app-subtle py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <PageHeader
          eyebrow="Learning paths"
          title={t("title")}
          description={t("subtitle")}
          actions={
            <Button asChild size="lg">
              <Link href="/learning-paths">
                {t("exploreAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
          className="mb-10"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {paths.slice(0, 4).map((path: LearningPathItemType, index: number) => {
            const stepTitles = [t("step1"), t("step2"), t("step3"), t("step4")];

            return (
              <Link
                key={path.id}
                href={`/learning-paths/${path.id}`}
                className="group block th-focus-ring rounded-xl"
              >
                <AppSurface padding="md" interactive className="h-full">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="th-hover-icon flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="th-hover-title mb-3 line-clamp-2 text-base font-semibold text-foreground">
                    {stepTitles[index] || path.title}
                  </h3>
                  {path.description ? (
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {path.description}
                    </p>
                  ) : null}
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[hsl(var(--learning-accent))]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {path.courses?.length || 0} {t("courses")}
                    </span>
                  </div>
                </AppSurface>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
