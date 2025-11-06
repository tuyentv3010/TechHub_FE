"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
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
  X,
  PlayCircle,
  Clock,
  Award,
  Video,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { 
  useLessonComments, 
  useAddLessonCommentMutation 
} from "@/queries/useCourseComments";
import { useCourseProgress, useMarkLessonCompleteMutation } from "@/queries/useCourseProgress";
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

  // Fetch course progress
  const { data: progressResponse } = useCourseProgress(courseSummary?.id, !!courseSummary?.id);
  const progressData = progressResponse?.payload?.data;
  const completedLessons = progressData?.completedLessons || 0;
  
  // Calculate progress percentage
  const progressPercentage = allLessons.length > 0 
    ? Math.round((completedLessons / allLessons.length) * 100) 
    : 0;

  // Mark lesson complete mutation
  const markCompleteMutation = useMarkLessonCompleteMutation();

  // Fetch lesson comments
  const { data: commentsResponse, isLoading: isLoadingComments } = useLessonComments(
    courseSummary?.id,
    currentLesson?.id,
    !!courseSummary?.id && !!currentLesson?.id
  );
  const comments = commentsResponse?.payload?.data ?? [];

  // Add lesson comment mutation
  const addCommentMutation = useAddLessonCommentMutation();

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    if (!progressData?.chapters) return false;
    for (const chapter of progressData.chapters) {
      const lesson = chapter.lessons.find((l: any) => l.lessonId === lessonId);
      if (lesson) return lesson.completed;
    }
    return false;
  };

  // Fireworks effect
  const triggerFireworks = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Shoot from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      // Shoot from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  // Handle mark lesson complete
  const handleMarkComplete = () => {
    if (!courseSummary?.id || !currentLesson?.id) return;
    
    markCompleteMutation.mutate(
      {
        courseId: courseSummary.id,
        lessonId: currentLesson.id,
      },
      {
        onSuccess: () => {
          // Trigger fireworks!
          triggerFireworks();
          
          toast({
            title: "🎉 Chúc mừng!",
            description: "Bạn đã hoàn thành bài học này!",
          });
        },
        onError: () => {
          toast({
            title: "Không thể đánh dấu hoàn thành",
            description: "Vui lòng thử lại sau.",
            variant: "destructive",
          });
        },
      }
    );
  };

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
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
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

            {/* Learning Outcomes */}
            <div className="bg-gradient-to-r from-primary/5 to-cyan-500/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Bạn sẽ làm được gì sau bài học này?</h3>
              </div>
              {courseSummary.outcomes && courseSummary.outcomes.length > 0 ? (
                <ul className="space-y-2">
                  {courseSummary.outcomes.slice(0, 3).map((outcome: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Hiểu rõ nội dung của bài học</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Áp dụng kiến thức vào thực tế</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Sẵn sàng cho bài học tiếp theo</span>
                  </li>
                </ul>
              )}
            </div>
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
        
        {/* Floating Action Buttons - Above navigation */}
        <div className="sticky bottom-20 left-0 right-0 bg-transparent pointer-events-none">  
          <div className="px-6 py-3 flex justify-center items-center gap-4 pointer-events-auto">
            {/* Mark Complete Button */}
            {isLessonCompleted(currentLesson?.id) ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Đã hoàn thành</span>
              </div>
            ) : (
              <Button
                onClick={handleMarkComplete}
                disabled={markCompleteMutation.isPending}
                className="h-12 px-6 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span className="font-medium">Hoàn thành</span>
              </Button>
            )}

            {/* Hỏi đáp Button */}
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
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
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
            <div className="p-2">
              <Accordion type="multiple" defaultValue={chapters.map((ch: any) => ch.id)} className="space-y-2">
                {chapters.map((chapter: any, chapterIndex: number) => {
                  const chapterLessons = chapter.lessons || [];
                  const completedCount = chapterLessons.filter((l: any) => 
                    isLessonCompleted(l.id)
                  ).length;

                  return (
                    <AccordionItem 
                      key={chapter.id} 
                      value={chapter.id}
                      className="border rounded-lg bg-card"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-t-lg">
                        <div className="flex items-center gap-3 text-left flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                            {chapterIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {chapter.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {completedCount}/{chapterLessons.length} • {Math.round((completedCount / chapterLessons.length) * 100)}%
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="space-y-1 pt-1">
                          {chapterLessons.map((lesson: any, lessonIndex: number) => {
                            const globalIndex = allLessons.findIndex(
                              (l) => l.id === lesson.id
                            );
                            const isCompleted = isLessonCompleted(lesson.id);
                            // Bài học bị khóa nếu: không phải bài hiện tại, không phải bài kế tiếp, và chưa hoàn thành
                            const isLocked = !isCompleted && globalIndex > currentLessonIndex + 1;
                            const isCurrent = globalIndex === currentLessonIndex;
                            const isFirstLesson = globalIndex === 0;

                            // Get content type icon (matching manage)
                            let contentIcon = <Video className="h-4 w-4" />;
                            if (lesson.contentType === "TEXT") {
                              contentIcon = <FileText className="h-4 w-4" />;
                            } else if (lesson.contentType === "QUIZ") {
                              contentIcon = <HelpCircle className="h-4 w-4" />;
                            } else if (lesson.contentType === "CODING") {
                              contentIcon = <Code className="h-4 w-4" />;
                            }

                            return (
                              <button
                                key={lesson.id}
                                className={`w-full p-3 rounded-lg border transition-all text-left ${
                                  isCurrent
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "hover:bg-muted/50 border-transparent"
                                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => !isLocked && onLessonChange(globalIndex)}
                                disabled={isLocked}
                                id={isFirstLesson ? "first-lesson" : globalIndex === 1 ? "second-lesson-locked" : undefined}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Status Icon */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : isLocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                                        {isCurrent && <div className="h-2 w-2 rounded-full bg-primary" />}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Lesson Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {lessonIndex + 1}.
                                      </span>
                                      <p className="text-sm font-medium line-clamp-2 flex-1">
                                        {lesson.title}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        {contentIcon}
                                        <span className="capitalize">
                                          {lesson.contentType?.toLowerCase() || "Video"}
                                        </span>
                                      </span>
                                      {lesson.estimatedDuration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {Math.floor(lesson.estimatedDuration / 60)} phút
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
