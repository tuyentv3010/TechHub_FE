"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import TableSkeleton from "@/components/Skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetChapters, useGetCourseById } from "@/queries/useCourse";

import AiExercisePanel from "./ai-exercise-panel";

const ChapterManagement = dynamic(() => import("./chapter-management"));
const ProgressTracker = dynamic(() => import("./progress-tracker"));
const LessonManagement = dynamic(() => import("./lesson-management"));
const AssetManagement = dynamic(() => import("./asset-management"));
const ExerciseManagement = dynamic(() => import("./exercise-management"));

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const t = useTranslations("ManageCourse");

  const { data: courseData, isLoading: courseLoading } = useGetCourseById(courseId);
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    refetch: refetchChapters,
  } = useGetChapters(courseId);

  const course = courseData?.payload?.data?.summary;
  const chapters = (chaptersData?.payload?.data || []) as any[];

  if (courseLoading) {
    return (
      <div className="manage-page">
        <TableSkeleton />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="manage-page">
        <Card className="manage-surface border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("CourseNotFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminPageFrame
      eyebrow="Studio / Course Detail"
      title={course.title}
      description={course.description}
    >
      <AdminSurface className="p-5 md:p-7">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="manage-subsurface p-4">
            <span className="text-muted-foreground">{t("Status")}: </span>
            <span className="font-medium">{t(`Status.${course.status}`)}</span>
          </div>
          <div className="manage-subsurface p-4">
            <span className="text-muted-foreground">{t("Level")}: </span>
            <span className="font-medium">{t(`Level.${course.level}`)}</span>
          </div>
          <div className="manage-subsurface p-4">
            <span className="text-muted-foreground">{t("Price")}: </span>
            <span className="font-medium">{course.price.toFixed(2)} USD</span>
          </div>
          <div className="manage-subsurface p-4">
            <span className="text-muted-foreground">{t("Enrollments")}: </span>
            <span className="font-medium">{course.totalEnrollments}</span>
          </div>
        </div>
      </AdminSurface>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="manage-glass h-auto rounded-2xl border border-border/50 p-1">
          <TabsTrigger value="content">{t("CourseContent")}</TabsTrigger>
          <TabsTrigger value="progress">{t("Progress")}</TabsTrigger>
          <TabsTrigger value="ai-exercises">{t("AiExercises")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Suspense fallback={<TableSkeleton />}>
            <ChapterManagement courseId={courseId} />
          </Suspense>

          {chaptersLoading ? (
            <TableSkeleton />
          ) : (
            <Card className="manage-surface border-border/50">
              <CardHeader>
                <CardTitle>{t("ChaptersAndLessons")}</CardTitle>
                <CardDescription>{t("ManageChaptersLessonsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {chapters.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">{t("NoChaptersYet")}</div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {chapters.map((chapter: any) => (
                      <AccordionItem key={chapter.id} value={chapter.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <span className="font-semibold">{chapter.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ({chapter.lessons?.length || 0} {t("Lessons")})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <LessonManagement
                            courseId={courseId}
                            chapterId={chapter.id}
                            lessons={chapter.lessons || []}
                            onRefresh={refetchChapters}
                          />

                          {chapter.lessons && chapter.lessons.length > 0 && (
                            <div className="space-y-4 border-l-2 pl-6">
                              {chapter.lessons.map((lesson: any) => (
                                <div key={lesson.id} className="space-y-4">
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">
                                      {t("AssetsFor")}: {lesson.title}
                                    </h5>
                                    <AssetManagement
                                      courseId={courseId}
                                      chapterId={chapter.id}
                                      lessonId={lesson.id}
                                      assets={lesson.assets || []}
                                      onRefresh={refetchChapters}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">
                                      {t("ExercisesFor")}: {lesson.title}
                                    </h5>
                                    <ExerciseManagement
                                      courseId={courseId}
                                      chapterId={chapter.id}
                                      lessonId={lesson.id}
                                      exercises={lesson.exercises || []}
                                      onRefresh={refetchChapters}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <Suspense fallback={<TableSkeleton />}>
            <ProgressTracker courseId={courseId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-exercises">
          {chaptersLoading ? (
            <TableSkeleton />
          ) : (
            <AiExercisePanel courseId={courseId} chapters={chapters} />
          )}
        </TabsContent>
      </Tabs>
    </AdminPageFrame>
  );
}
