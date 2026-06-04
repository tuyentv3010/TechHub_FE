"use client";

import { BookOpen, Check, ChevronDown, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetCourseById, useGetCourseList } from "@/queries/useCourse";
import type { CourseItemResType } from "@/schemaValidations/course.schema";

type LessonOption = {
  id: string;
  title: string;
  chapterTitle?: string;
};

type IntegratedBlogLinkPickerProps = {
  relatedCourseIds: string[];
  relatedLessonIds: string[];
  onRelatedCourseIdsChange: (ids: string[]) => void;
  onRelatedLessonIdsChange: (ids: string[]) => void;
};

const unique = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

const readLessons = (chapters: unknown): LessonOption[] => {
  if (!Array.isArray(chapters)) return [];

  return chapters.flatMap((chapter: any) => {
    const lessons = Array.isArray(chapter?.lessons) ? chapter.lessons : [];
    return lessons
      .filter((lesson: any) => lesson?.id && lesson?.title)
      .map((lesson: any) => ({
        id: String(lesson.id),
        title: String(lesson.title),
        chapterTitle: chapter?.title ? String(chapter.title) : undefined,
      }));
  });
};

const RelatedCourseLessons = ({
  courseId,
  relatedLessonIds,
  onRelatedLessonIdsChange,
}: {
  courseId: string;
  relatedLessonIds: string[];
  onRelatedLessonIdsChange: (ids: string[]) => void;
}) => {
  const { data, isLoading } = useGetCourseById(courseId);
  const lessons = readLessons(data?.payload?.data?.chapters);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading lessons...
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        No lessons found for this course.
      </p>
    );
  }

  return (
    <div className="space-y-1 border-l border-border/70 pl-3">
      {lessons.map((lesson) => {
        const selected = relatedLessonIds.includes(lesson.id);
        return (
          <button
            key={lesson.id}
            type="button"
            onClick={() =>
              onRelatedLessonIdsChange(unique(toggleId(relatedLessonIds, lesson.id)))
            }
            className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted/60"
          >
            <span
              className={[
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
              ].join(" ")}
            >
              {selected && <Check className="h-3 w-3" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{lesson.title}</span>
              {lesson.chapterTitle && (
                <span className="block truncate text-xs text-muted-foreground">
                  {lesson.chapterTitle}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default function IntegratedBlogLinkPicker({
  relatedCourseIds,
  relatedLessonIds,
  onRelatedCourseIdsChange,
  onRelatedLessonIdsChange,
}: IntegratedBlogLinkPickerProps) {
  const { data, isLoading } = useGetCourseList({
    page: 0,
    size: 50,
    status: "PUBLISHED",
    auth: false,
    redirectOnUnauthorized: false,
    suppressErrorLog: true,
    retry: false,
  });
  const courses: CourseItemResType[] = data?.payload?.data ?? [];

  const handleCourseToggle = (courseId: string) => {
    const nextCourseIds = unique(toggleId(relatedCourseIds, courseId));
    onRelatedCourseIdsChange(nextCourseIds);

    if (relatedCourseIds.includes(courseId)) {
      onRelatedLessonIdsChange(relatedLessonIds);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-primary" />
            Integrated learning links
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Attach this blog to courses and lessons so readers can continue learning.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {relatedCourseIds.length} courses
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published courses found.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {courses.map((course) => {
            const selected = relatedCourseIds.includes(course.id);
            return (
              <div key={course.id} className="rounded-lg border border-border/60 bg-background">
                <button
                  type="button"
                  onClick={() => handleCourseToggle(course.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted/50"
                >
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    ].join(" ")}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{course.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {course.level} · {course.language}
                    </span>
                  </span>
                  <ChevronDown
                    className={[
                      "h-4 w-4 text-muted-foreground transition",
                      selected ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {selected && (
                  <div className="space-y-2 border-t border-border/60 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Related lessons
                    </div>
                    <RelatedCourseLessons
                      courseId={course.id}
                      relatedLessonIds={relatedLessonIds}
                      onRelatedLessonIdsChange={onRelatedLessonIdsChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{relatedLessonIds.length} lessons selected</span>
        {(relatedCourseIds.length > 0 || relatedLessonIds.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              onRelatedCourseIdsChange([]);
              onRelatedLessonIdsChange([]);
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
