"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useGetCourseById, useGetChapters } from "@/queries/useCourse";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/Skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LessonManagement from "./lesson-management";
import AssetManagement from "./asset-management";
import AiExercisePanel from "./ai-exercise-panel";

const ChapterManagement = dynamic(() => import("./chapter-management"));
const ProgressTracker = dynamic(() => import("./progress-tracker"));

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const t = useTranslations("ManageCourse");

  const { data: courseData, isLoading: courseLoading } = useGetCourseById(courseId);
  const { data: chaptersData, isLoading: chaptersLoading, refetch: refetchChapters } = useGetChapters(courseId);

  const course = courseData?.payload?.data?.summary;    
  const chapters = (chaptersData?.payload?.data || []) as any[];

  if (courseLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t("CourseNotFound")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{course.title}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("Status")}: </span>
              <span className="font-medium">{t(`Status.${course.status}`)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Level")}: </span>
              <span className="font-medium">{t(`Level.${course.level}`)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Price")}: </span>
              <span className="font-medium">${course.price}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Enrollments")}: </span>
              <span className="font-medium">{course.totalEnrollments}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">{t("CourseContent")}</TabsTrigger>
          <TabsTrigger value="progress">{t("Progress")}</TabsTrigger>
          <TabsTrigger value="ai-exercises">{t("AiExercises")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Chapter Management */}
          <Suspense fallback={<TableSkeleton />}>
            <ChapterManagement courseId={courseId} />
          </Suspense>

          {/* Chapters with Lessons */}
          {chaptersLoading ? (
            <TableSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("ChaptersAndLessons")}</CardTitle>
                <CardDescription>{t("ManageChaptersLessonsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {chapters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("NoChaptersYet")}
                  </div>
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
                          {/* Lesson Management */}
                          <LessonManagement
                            courseId={courseId}
                            chapterId={chapter.id}
                            lessons={chapter.lessons || []}
                            onRefresh={refetchChapters}
                          />

                          {/* Assets for each lesson */}
                          {chapter.lessons && chapter.lessons.length > 0 && (
                            <div className="space-y-4 pl-6 border-l-2">
                              {chapter.lessons.map((lesson: any) => (
                                <div key={lesson.id} className="space-y-2">
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
    </main>
  );
}
