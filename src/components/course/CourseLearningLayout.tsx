"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  MessageSquare,
  BookOpen,
  BookOpenCheck,
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
  HelpCircle,
  Badge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useLessonComments, 
  useAddLessonCommentMutation 
} from "@/queries/useCourseComments";
import { useCourseProgress, useMarkLessonCompleteMutation } from "@/queries/useCourseProgress";
import { useGetExercises } from "@/queries/useCourse";
import { CourseCommentsList } from "./CourseCommentsList";
import ExerciseDisplay from "./ExerciseDisplay";
import ExercisePlayer from "./ExercisePlayer";
import VideoPlayer from "./VideoPlayer";
import envConfig from "@/config";

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
  const queryClient = useQueryClient();
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
  console.log("dasasdasdas asd asd as", currentLesson);
  // Fetch exercises for current lesson
  const { data: exercisesResponse } = useGetExercises(
    courseSummary?.id, 
    currentLesson?.id
  );
  const exercises = exercisesResponse?.payload?.data || [];
  console.log("loli " , exercisesResponse);
  // DEBUG: Log exercise data
  console.log('=== EXERCISE DEBUG ===');
  console.log('Course ID:', courseSummary?.id);
  console.log('Current Lesson:', currentLesson);
  console.log('Current Lesson ID:', currentLesson?.id);
  console.log('Exercises Response:', exercisesResponse);
  console.log('Exercises Data:', exercises);
  console.log('Current Lesson hasExercise:', currentLesson?.hasExercise);
  console.log('Exercises count:', exercises.length);

  // Fetch course progress
  const { data: progressResponse } = useCourseProgress(courseSummary?.id, !!courseSummary?.id);
  const progressData = progressResponse?.payload?.data;
  const completedLessons = progressData?.completedLessons || 0;
  
  // Calculate progress percentage
  const progressPercentage = allLessons.length > 0 
    ? Math.round((completedLessons / allLessons.length) * 100) 
    : 0;

  // DEBUG: Log progress data from API
  console.log('=== PROGRESS DEBUG ===');
  console.log('Course ID:', courseSummary?.id);
  console.log('Progress Response:', progressResponse);
  console.log('Progress Data:', progressData);
  console.log('Completed Lessons Count:', completedLessons);
  console.log('Total Lessons:', allLessons.length);
  console.log('Progress Percentage:', progressPercentage);
  console.log('All Lessons IDs:', allLessons.map(l => l.id));
  if (progressData?.chapters) {
    console.log('Completed Lessons from API:');
    progressData.chapters.forEach((ch: any) => {
      ch.lessons?.forEach((l: any) => {
        if (l.completed) {
          console.log(`  - ${l.lessonId}: completed`);
        }
      });
    });
  }
  console.log('=====================');

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

  // WebSocket connection for real-time lesson comments
  useEffect(() => {
    if (!currentLesson?.id) return;

    console.log("[WebSocket] Connecting for lesson:", currentLesson.id);
    
    const client = new Client({
      webSocketFactory: () => {
        const wsBase = envConfig.NEXT_PUBLIC_WS_BASE || envConfig.NEXT_PUBLIC_API_ENDPOINT;
        const sockJsUrl = `${wsBase}/course-service/ws-comment`;
        console.log("[WebSocket] Creating SockJS connection to:", sockJsUrl);
        return new SockJS(sockJsUrl) as WebSocket;
      },
      debug: (str) => {
        if (str.includes("CONNECT") || str.includes("MESSAGE") || str.includes("ERROR")) {
          console.log("[STOMP]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("[WebSocket] Connected! Subscribing to lesson comments...");
        
        const destination = `/topic/lesson/${currentLesson.id}/comments`;
        console.log("[WebSocket] Subscribing to:", destination);
        
        client.subscribe(destination, (message) => {
          console.log("[WebSocket] Received message:", message.body);
          try {
            const data = JSON.parse(message.body);
            console.log("[WebSocket] New lesson comment received:", data);
            
            // Invalidate comments query to refetch
            queryClient.invalidateQueries({ 
              queryKey: ["lesson-comments", courseSummary?.id, currentLesson.id] 
            });
            
            toast({
              title: "Bình luận mới",
              description: "Có người vừa bình luận trong bài học này!",
            });
          } catch (e) {
            console.error("[WebSocket] Error parsing message:", e);
          }
        });
      },
      onDisconnect: () => {
        console.log("[WebSocket] Disconnected");
      },
      onStompError: (frame) => {
        console.error("[WebSocket] STOMP Error:", frame.headers["message"]);
      },
    });

    client.activate();

    return () => {
      console.log("[WebSocket] Cleaning up connection...");
      client.deactivate();
    };
  }, [currentLesson?.id, courseSummary?.id, queryClient, toast]);

  // Check if a lesson is completed (only from API/database)
  const isLessonCompleted = (lessonId: string) => {
    console.log(`[isLessonCompleted] Checking lesson ${lessonId}`);
    
    if (progressData?.chapters) {
      console.log('  Searching in chapters...');
      for (const chapter of progressData.chapters) {
        console.log('    Chapter ID:', chapter.id, 'lessons:', chapter.lessons);
        // API returns lesson.id (not lessonId) and lesson.completed (not completed)
        const lesson = chapter.lessons?.find((l: any) => l.id === lessonId);
        if (lesson) {
          console.log('    Found lesson:', lesson);
          console.log('    Lesson completed status:', lesson.completed);
          if (lesson.completed === true) {
            console.log(`  ✓ Lesson ${lessonId} is completed (from API)`);
            return true;
          }
        }
      }
    } else {
      console.log('  No chapters data available');
    }
    
    console.log(`  ✗ Lesson ${lessonId} is NOT completed`);
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
    if (!courseSummary?.id || !currentLesson?.id) {
      console.log('[handleMarkComplete] Missing courseId or lessonId');
      return;
    }
    
    console.log('[handleMarkComplete] Marking lesson complete:', {
      courseId: courseSummary.id,
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title
    });
    
    markCompleteMutation.mutate(
      {
        courseId: courseSummary.id,
        lessonId: currentLesson.id,
      },
      {
        onSuccess: (response) => {
          console.log('[handleMarkComplete] ✓ Success:', response);
          
          // Invalidate and refetch progress data
          queryClient.invalidateQueries({ 
            queryKey: ['course-progress', courseSummary.id] 
          });
          
          // Trigger fireworks after successful API call
          triggerFireworks();
          
          toast({
            title: "🎉 Chúc mừng!",
            description: "Bạn đã hoàn thành bài học này!",
          });
        },
        onError: (error) => {
          console.error('[handleMarkComplete] ✗ Error:', error);
          
          toast({
            title: "Lỗi",
            description: "Không thể đánh dấu hoàn thành bài học.",
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
          <div className="bg-black flex items-center justify-center w-full" id="video-player-area">
            {currentLesson?.videoUrl ? (
              <VideoPlayer
                src={currentLesson.videoUrl}
                title={currentLesson?.title}
                subtitle={courseSummary?.instructorName}
                onEnded={() => {
                  // Optional: Auto-advance to next lesson
                  console.log("Video ended");
                }}
              />
            ) : (
              <div className="text-white text-center p-8 aspect-video w-full flex flex-col items-center justify-center">
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

          </div>

          {/* Exercise Section - New Interactive Design */}
          <div id="exercise-section" className="p-6 border-b">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Bài tập thực hành
              {exercises.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-2">
                  {exercises.length} câu hỏi
                </span>
              )}
            </h3>
              
            {!exercisesResponse && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Đang tải bài tập...</p>
              </div>
            )}
            
            {exercisesResponse && exercises.length === 0 && (
              <div 
                className="text-center py-12 rounded-2xl"
                style={{ backgroundColor: '#FFF8DD' }}
              >
                <HelpCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Bài học này chưa có bài tập</p>
              </div>
            )}
            
            {exercises.length > 0 && (
              <ExercisePlayer
                exercises={exercises.map((exercise: any) => ({
                  id: exercise.id,
                  type: exercise.type,
                  question: exercise.question,
                  options: exercise.options,
                  testCases: exercise.testCases
                }))}
                lessonTitle={currentLesson?.title}
                onComplete={(results) => {
                  console.log('All exercises completed:', results);
                  const allCorrect = results.every(r => r.isCorrect);
                  if (allCorrect) {
                    confetti({
                      particleCount: 150,
                      spread: 100,
                      origin: { y: 0.6 }
                    });
                  }
                }}
              />
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
          <div className="h-24"></div>
        </ScrollArea>

        {/* Navigation Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 left-0 right-0 bg-background">
          {/* Navigation Buttons */}
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between gap-2">
              {/* Bài trước */}
              <Button
                variant="outline"
                disabled={currentLessonIndex === 0}
                onClick={() => onLessonChange(currentLessonIndex - 1)}
                className="flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                BÀI TRƯỚC
              </Button>

              {/* Hoàn thành + Hỏi đáp - Ở giữa */}
              <div className="flex items-center gap-2">
                {/* Mark Complete Button */}
                {isLessonCompleted(currentLesson?.id) ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-600 text-white shadow-md">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium hidden sm:inline">Đã hoàn thành</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    size="sm"
                    className="rounded-full bg-green-600 hover:bg-green-700 shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-medium">Hoàn thành</span>
                  </Button>
                )}

                {/* Hỏi đáp Button */}
                <Button 
                  onClick={() => setShowCommentModal(true)}
                  variant="default"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-orange-500 hover:bg-orange-600 shadow-md"
                  id="qa-button"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>

                {/* Bài tập Button */}
                <Button 
                  onClick={() => {
                    const exerciseSection = document.getElementById('exercise-section');
                    if (exerciseSection) {
                      exerciseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  variant="default"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-purple-500 hover:bg-purple-600 shadow-md"
                  title="Bài tập"
                >
                  <BookOpenCheck className="h-4 w-4" />
                </Button>
              </div>

              {/* Bài tiếp theo */}
              <Button
                disabled={currentLessonIndex >= allLessons.length - 1}
                onClick={() => onLessonChange(currentLessonIndex + 1)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-shrink-0"
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

                            // DEBUG: Log lesson render state
                            console.log(`[Lesson Render] ${lesson.title}:`, {
                              lessonId: lesson.id,
                              isCompleted,
                              isLocked,
                              isCurrent,
                              globalIndex,
                              currentLessonIndex
                            });

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
                                className={`w-full p-3 rounded-lg border transition-all text-left relative ${
                                  isCurrent
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "hover:bg-muted/50 border-transparent"
                                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => !isLocked && onLessonChange(globalIndex)}
                                disabled={isLocked}
                                id={isFirstLesson ? "first-lesson" : globalIndex === 1 ? "second-lesson-locked" : undefined}
                              >
                                {/* Completed Badge - Small green checkmark at bottom right */}
                                {isCompleted && (
                                  <div className="absolute bottom-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white">
                                    <CheckCircle2 className="h-3.5 w-3.5" fill="currentColor" />
                                  </div>
                                )}

                                <div className="flex items-start gap-3">
                                  {/* Status Icon */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                      <div className="h-5 w-5 rounded-full border-2 border-green-600 flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      </div>
                                    ) : isLocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                                        {isCurrent && <div className="h-2 w-2 rounded-full bg-primary" />}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Lesson Info */}
                                  <div className="flex-1 min-w-0 pr-6">
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
                                      {lesson.hasExercise && (
                                        <span className="flex items-center gap-1 text-orange-600">
                                          <HelpCircle className="h-3 w-3" />
                                          Bài tập
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
