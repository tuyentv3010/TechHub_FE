"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CourseLearningLayoutProps {
  course: any;
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
}

export default function CourseLearningLayout({
  course,
  currentLessonIndex,
  onLessonChange,
}: CourseLearningLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const courseSummary = course.summary;
  const chapters = course.chapters || [];

  // Flatten all lessons
  const allLessons: any[] = [];
  chapters.forEach((chapter: any) => {
    if (chapter.lessons) {
      chapter.lessons.forEach((lesson: any) => {
        allLessons.push({
          ...lesson,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        });
      });
    }
  });

  const currentLesson = allLessons[currentLessonIndex];

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" id="learning-content-area">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg line-clamp-1">
                {courseSummary.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentLessonIndex + 1}/{allLessons.length} bài học
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? "Ẩn" : "Hiện"} danh sách
          </Button>
        </header>

        {/* Video/Content Player */}
        <div className="bg-black flex items-center justify-center aspect-video max-h-[500px]" id="video-player-area">
          {currentLesson?.videoUrl ? (
            <video
              src={currentLesson.videoUrl}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            >
              Your browser does not support video.
            </video>
          ) : (
            <div className="text-white text-center">
              <p className="text-xl mb-2">{currentLesson?.title}</p>
              <p className="text-muted-foreground">
                {currentLesson?.description || "Nội dung bài học"}
              </p>
            </div>
          )}
        </div>

        {/* Lesson Info & Actions */}
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">{currentLesson?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {currentLesson?.chapterTitle}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentLessonIndex === 0}
                onClick={() => onLessonChange(currentLessonIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Bài trước
              </Button>
              <Button
                disabled={currentLessonIndex >= allLessons.length - 1}
                onClick={() => onLessonChange(currentLessonIndex + 1)}
              >
                Bài tiếp
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes & Discussion Tabs */}
        <div className="border-t bg-card" id="notes-discussion-area">
          <div className="flex gap-4 px-4 py-2 border-b">
            <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary">
              Thảo luận
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Ghi chú
            </button>
          </div>
          <div className="p-4 h-48 overflow-y-auto">
            <p className="text-sm text-muted-foreground text-center">
              Chưa có thảo luận nào. Hãy là người đầu tiên!
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      {isSidebarOpen && (
        <aside
          className="w-96 border-l bg-card flex flex-col"
          id="lesson-sidebar"
        >
          <div className="p-4 border-b">
            <h3 className="font-semibold">Nội dung khóa học</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {course.completedLessons || 0}/{allLessons.length} bài hoàn thành
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {chapters.map((chapter: any, chapterIndex: number) => (
                <div key={chapter.id}>
                  <h4 className="font-semibold text-sm mb-2">
                    {chapterIndex + 1}. {chapter.title}
                  </h4>
                  <div className="space-y-1">
                    {chapter.lessons?.map((lesson: any, lessonIndex: number) => {
                      const globalIndex = allLessons.findIndex(
                        (l) => l.id === lesson.id
                      );
                      const isCompleted = false; // TODO: Get from progress
                      const isLocked = globalIndex > currentLessonIndex + 1;
                      const isCurrent = globalIndex === currentLessonIndex;
                      const isFirstLesson = globalIndex === 0;

                      return (
                        <Card
                          key={lesson.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            isCurrent
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          } ${isLocked ? "opacity-50" : ""}`}
                          onClick={() => !isLocked && onLessonChange(globalIndex)}
                          id={isFirstLesson ? "first-lesson" : globalIndex === 1 ? "second-lesson-locked" : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : isLocked ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {lesson.title}
                              </p>
                              {lesson.estimatedDuration && (
                                <p className="text-xs text-muted-foreground">
                                  {Math.floor(lesson.estimatedDuration / 60)} phút
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
