"use client";

import { useTranslations } from "next-intl";
import { useGetLearningPathById } from "@/queries/useLearningPath";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Calendar,
  User,
  Target,
} from "lucide-react";
import Link from "next/link";
import { formatDateTimeToLocaleString } from "@/lib/utils";
import Image from "next/image";

interface LearningPathDetailProps {
  pathId: string;
}

export default function LearningPathDetail({ pathId }: LearningPathDetailProps) {
  const t = useTranslations("LearningPathDetail");
  const { data, isLoading } = useGetLearningPathById(pathId);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const path = data?.payload?.data;

  if (!path) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">{t("notFound")}</h2>
        <p className="text-muted-foreground mt-2">{t("notFoundDescription")}</p>
        <Link href="/learning-paths">
          <Button className="mt-4">{t("backToList")}</Button>
        </Link>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/learning-paths" className="hover:text-primary">
            {t("learningPaths")}
          </Link>
          <span>/</span>
          <span>{path.title}</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={getLevelColor(path.level)}>
              {t(`level.${path.level}`)}
            </Badge>
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {path.courses?.length || 0} {t("courses")}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {path.estimatedDuration} {t("hours")}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{path.title}</h1>
          
          {path.description && (
            <p className="text-xl text-muted-foreground">{path.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skills Section */}
          {path.skills && path.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t("skillsYouWillLearn")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {path.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-2 px-4">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t("coursesInPath")}
              </CardTitle>
              <CardDescription>
                {path.courses?.length || 0} {t("coursesTotal")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {path.courses && path.courses.length > 0 ? (
                <div className="space-y-4">
                  {path.courses
                    .sort((a, b) => a.order - b.order)
                    .map((course, idx) => (
                      <div
                        key={course.courseId}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold">{course.title || `Course ${idx + 1}`}</h4>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description}
                            </p>
                          )}
                          {course.isOptional === "Y" && (
                            <Badge variant="outline" className="text-xs">
                              {t("optional")}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/courses/${course.courseId}`}>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("noCoursesYet")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pathInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("duration")}</p>
                  <p className="text-muted-foreground">
                    {path.estimatedDuration} {t("hours")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("level")}</p>
                  <p className="text-muted-foreground">
                    {t(`level.${path.level}`)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("courses")}</p>
                  <p className="text-muted-foreground">
                    {path.courses?.length || 0} {t("coursesTotal")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("created")}</p>
                  <p className="text-muted-foreground">
                    {formatDateTimeToLocaleString(path.created)}
                  </p>
                </div>
              </div>

              <Separator />

              <Button className="w-full" size="lg">
                {t("startLearning")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("shareThisPath")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("shareDescription")}
              </p>
              <Button variant="outline" className="w-full">
                {t("copyLink")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
