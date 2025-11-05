"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGetProgress, useMarkLessonCompleteMutation } from "@/queries/useCourse";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import TableSkeleton from "@/components/Skeleton";

interface ProgressTrackerProps {
  courseId: string;
}

export default function ProgressTracker({ courseId }: ProgressTrackerProps) {
  const t = useTranslations("ManageCourse");
  const { data: progressData, isLoading, refetch } = useGetProgress(courseId);
  const markCompleteMutation = useMarkLessonCompleteMutation();

  if (isLoading) {
    return <TableSkeleton />;
  }

  const progress = progressData?.payload?.data;

  if (!progress) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            {t("NoProgressData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = progress.overallProgress || 0;
  const completedLessons = progress.completedLessons || 0;
  const totalLessons = progress.totalLessons || 0;
  const lessons = progress.lessons || [];

  const handleMarkComplete = async (lessonId: string) => {
    try {
      await markCompleteMutation.mutateAsync({ courseId, lessonId });
      toast({
        title: t("Success"),
        description: t("LessonMarkedComplete"),
      });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("CourseProgress")}</CardTitle>
        <CardDescription>{t("TrackYourLearningProgress")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{t("OverallProgress")}</h4>
              <p className="text-sm text-muted-foreground">
                {completedLessons} {t("Of")} {totalLessons} {t("LessonsCompleted")}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {Math.round(overallProgress)}%
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Lesson Progress List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">{t("LessonProgress")}</h4>
          {lessons.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {t("NoLessonsYet")}
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson: any) => {
                const progressPercent = lesson.watchedDuration && lesson.duration
                  ? Math.round((lesson.watchedDuration / lesson.duration) * 100)
                  : 0;

                return (
                  <div
                    key={lesson.lessonId}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {lesson.lessonTitle || t("Lesson")}
                          </span>
                          {lesson.completed && (
                            <Badge variant="default" className="text-xs">
                              {t("Completed")}
                            </Badge>
                          )}
                        </div>
                        {lesson.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            {t("CompletedOn")}: {new Date(lesson.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {!lesson.completed && lesson.watchedDuration > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {Math.floor(lesson.watchedDuration / 60)}m / {Math.floor((lesson.duration || 0) / 60)}m
                            </span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                      )}

                      {lesson.lastPosition > 0 && !lesson.completed && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {t("LastPosition")}: {Math.floor(lesson.lastPosition / 60)}m
                          </span>
                        </div>
                      )}
                    </div>

                    {!lesson.completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => handleMarkComplete(lesson.lessonId)}
                        disabled={markCompleteMutation.isPending}
                      >
                        {t("MarkComplete")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
