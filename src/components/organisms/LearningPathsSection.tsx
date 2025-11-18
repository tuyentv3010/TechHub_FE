"use client";

import { useTranslations } from "next-intl";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  ArrowRight,
  Route,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { LearningPathLevelEnum } from "@/schemaValidations/learning-path.schema";

export function LearningPathsSection() {
  const t = useTranslations("HomePage.learningPaths");
  
  const { data, isLoading } = useGetLearningPathList({
    page: 0,
    size: 3, // Show only 3 paths on homepage
    sortBy: "created",
    sortDirection: "DESC",
  });

  const paths = data?.payload?.data || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case LearningPathLevelEnum.BEGINNER:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case LearningPathLevelEnum.INTERMEDIATE:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case LearningPathLevelEnum.ADVANCED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (paths.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{t("badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Learning Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {paths.map((path) => (
            <Card 
              key={path.id} 
              className="group hover:shadow-xl transition-all duration-300 hover:border-primary/50 overflow-hidden"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={getLevelColor(path.level)}>
                    {t(`levels.${path.level}`)}
                  </Badge>
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {path.courses?.length || 0}
                  </Badge>
                </div>
                <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {path.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {path.description || t("noDescription")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{path.estimatedDuration}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{path.skills?.length || 0} {t("skills")}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/learning-paths/${path.id}`} className="block">
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {t("viewPath")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/learning-paths">
            <Button size="lg" variant="outline" className="group">
              {t("viewAll")}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
