"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  MessageSquare,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Code,
  Image as ImageIcon,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { 
  useLessonComments, 
  useAddLessonCommentMutation 
} from "@/queries/useCourseComments";
import { CourseCommentsList } from "./CourseCommentsList";

interface CourseLearningLayoutProps {
  course: any;
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
  onStartTour?: () => void;
}

export default function CourseLearningLayout({
  course,
  currentLessonIndex,
  onLessonChange,
  onStartTour,
}: CourseLearningLayoutProps) {
  const t = useTranslations("ManageCourse");
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showContentDescription, setShowContentDescription] = useState(true);
  
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
  const completedLessons = 0; // TODO: Get from progress API
  const progressPercentage = allLessons.length > 0 
    ? Math.round((completedLessons / allLessons.length) * 100) 
    : 0;

  // Fetch lesson comments
  const { data: commentsResponse, isLoading: isLoadingComments } = useLessonComments(
    courseSummary?.id,
    currentLesson?.id,
    !!courseSummary?.id && !!currentLesson?.id
  );
  const comments = commentsResponse?.payload?.data ?? [];

  // Add lesson comment mutation
  const addCommentMutation = useAddLessonCommentMutation();

  const handleSubmitComment = (content: string) => {
    if (!courseSummary?.id || !currentLesson?.id) {
      toast({
        title: "Không thể gửi bình luận",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        courseId: courseSummary.id,
        lessonId: currentLesson.id,
        body: {
          content: content,
          parentId: undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã gửi bình luận",
          });
        },
        onError: () => {
          toast({
            title: "Không thể gửi bình luận",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSubmitReply = (parentId: string, content: string) => {
    if (!courseSummary?.id || !currentLesson?.id) {
      toast({
        title: "Không thể gửi phản hồi",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        courseId: courseSummary.id,
        lessonId: currentLesson.id,
        body: {
          content: content,
          parentId: parentId,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã gửi phản hồi",
          });
        },
        onError: () => {
          toast({
            title: "Không thể gửi phản hồi",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Get asset icon
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <FileText className="h-4 w-4" />;
      case "DOCUMENT": return <Download className="h-4 w-4" />;
      case "LINK": return <ExternalLink className="h-4 w-4" />;
      case "IMAGE": return <ImageIcon className="h-4 w-4" />;
      case "CODE": return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden" id="learning-content-area">
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
                {completedLessons}/{allLessons.length} bài hoàn thành • {progressPercentage}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartTour?.()}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Hướng dẫn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? "Ẩn" : "Hiện"} danh sách
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1">
          {/* Video/Content Player */}
          <div className="bg-black flex items-center justify-center w-full max-h-[600px]" id="video-player-area">
            {currentLesson?.videoUrl ? (
              <video
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full max-h-[600px] object-contain"
                controlsList="nodownload"
              >
                Your browser does not support video.
              </video>
            ) : (
              <div className="text-white text-center p-8">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">{currentLesson?.title}</p>
                <p className="text-muted-foreground">
                  {currentLesson?.description || "Nội dung bài học"}
                </p>
              </div>
            )}
          </div>

          {/* Lesson Title & Info */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{currentLesson?.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Cập nhật {currentLesson?.created ? new Date(currentLesson.created).toLocaleDateString('vi-VN') : 'N/A'}
                </p>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0" id="add-note-button">
                <FileText className="h-4 w-4 mr-2" />
                Thêm ghi chú tại 01:46
              </Button>
            </div>
            
            {/* Content Description Collapsible */}
            {currentLesson?.content && (
              <div className="bg-muted/30 rounded-lg p-4">
                <button 
                  onClick={() => setShowContentDescription(!showContentDescription)}
                  className="flex items-center justify-between w-full text-left font-medium mb-2"
                >
                  <span>Nội dung bài học</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showContentDescription ? 'rotate-90' : ''}`} />
                </button>
                {showContentDescription && (  
                  <div 
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />)
                }
              </div>
            )}
          </div>

          {/* Lesson Assets/Resources */}
          {currentLesson?.assets && currentLesson.assets.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="font-semibold mb-3">Tài liệu & Link</h3>
              <div className="space-y-2">
                {currentLesson.assets.map((asset: any) => (
                  <a
                    key={asset.id}
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded bg-primary/10">
                      {getAssetIcon(asset.assetType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{asset.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{asset.assetType}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Spacing for sticky navigation */}
          <div className="h-32"></div>
        </ScrollArea>
        
        {/* Hỏi đáp Button - Floating above navigation */}
        <div className="sticky bottom-20 left-0 right-0 bg-transparent pointer-events-none">  
          <div className="px-6 py-3 flex justify-end pointer-events-auto">
            <Button 
              onClick={() => setShowCommentModal(true)}
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg"
              id="qa-button"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Navigation Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 left-0 right-0 bg-background">
          {/* Hỏi đáp Button - Above navigation */}
 
          {/* Navigation Buttons */}
          <div className="px-6 py-4 flex items-center justify-between border-t">
            <Button
              variant="outline"
              disabled={currentLessonIndex === 0}
              onClick={() => onLessonChange(currentLessonIndex - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              BÀI TRƯỚC
            </Button>
            <Button
              disabled={currentLessonIndex >= allLessons.length - 1}
              onClick={() => onLessonChange(currentLessonIndex + 1)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              BÀI TIẾP THEO
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      {isSidebarOpen && (
        <aside
          className="w-[45%] min-w-[320px] max-w-[400px] border-l bg-card flex flex-col"
          id="lesson-sidebar"
        >
          {/* Progress Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nội dung khóa học</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {completedLessons}/{allLessons.length} bài học
                </span>
                <span className="font-bold text-primary">{progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedLessons === allLessons.length 
                  ? "🎉 Đã hoàn thành khóa học!" 
                  : `Còn ${allLessons.length - completedLessons} bài để hoàn thành`
                }
              </p>
            </div>
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

      {/* Comment/Discussion Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Hỏi đáp - {currentLesson?.title}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(80vh-120px)] pr-4">
            <CourseCommentsList
              comments={comments}
              isLoading={isLoadingComments}
              isSubmitting={addCommentMutation.isPending}
              onSubmitComment={handleSubmitComment}
              onSubmitReply={handleSubmitReply}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
