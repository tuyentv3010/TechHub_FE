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
  Badge,
  Flame
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
import { useAccountProfile } from "@/queries/useAccount";
import { CourseCommentsList } from "./CourseCommentsList";
import ExerciseDisplay from "./ExerciseDisplay";
import ExercisePlayer from "./ExercisePlayer";
import VideoPlayer from "./VideoPlayer";
import envConfig from "@/config";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

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
  const commentT = useTranslations("CourseComments");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showContentDescription, setShowContentDescription] = useState(true);
  
  // Fetch user profile for avatar
  const { data: profileData } = useAccountProfile();
  const userAvatar = normalizePersistedMediaUrl(profileData?.payload?.data?.avatar) || undefined;
  
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
  const currentLessonVideoUrl = normalizePersistedMediaUrl(currentLesson?.videoUrl);
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
  const learningStreak = progressData?.learningStreak;
  
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
              title: commentT("newCourseCommentTitle"),
              description: commentT("newLessonCommentDescription"),
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
  }, [commentT, currentLesson?.id, courseSummary?.id, queryClient, toast]);

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
        title: commentT("submitCommentErrorTitle"),
        description: commentT("tryAgainDescription"),
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
            title: commentT("submitCommentSuccessTitle"),
          });
        },
        onError: () => {
          toast({
            title: commentT("submitCommentErrorTitle"),
            description: commentT("loginAndRetryDescription"),
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSubmitReply = (parentId: string, content: string) => {
    if (!courseSummary?.id || !currentLesson?.id) {
      toast({
        title: commentT("submitReplyErrorTitle"),
        description: commentT("tryAgainDescription"),
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
            title: commentT("submitReplySuccessTitle"),
          });
        },
        onError: () => {
          toast({
            title: commentT("submitReplyErrorTitle"),
            description: commentT("loginAndRetryDescription"),
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

  // Download asset file - fetch as blob then download
  const handleDownloadAsset = async (e: React.MouseEvent, url: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔽 Download started:', { url, title });
    
    try {
      // Fetch file as blob
      console.log('📥 Fetching file...');
      const response = await fetch(url);
      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob created:', { size: blob.size, type: blob.type });
      
      // Determine filename with extension
      let filename = title;
      
      // Check if title already has extension
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(title);
      
      if (!hasExtension) {
        // Try to get extension from content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let ext = '';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            const originalFilename = filenameMatch[1];
            const extMatch = originalFilename.match(/\.[a-zA-Z0-9]+$/);
            if (extMatch) {
              ext = extMatch[0];
            }
          }
        }
        
        // If no extension from content-disposition, try content-type
        if (!ext) {
          const contentType = response.headers.get('content-type') || blob.type;
          const extensionMap: Record<string, string> = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'text/plain': '.txt',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'video/mp4': '.mp4',
          };
          ext = extensionMap[contentType] || '';
        }
        
        // If still no extension, try to extract from URL
        if (!ext) {
          const urlPath = new URL(url).pathname;
          const urlExtMatch = urlPath.match(/\.[a-zA-Z0-9]+$/);
          if (urlExtMatch) {
            ext = urlExtMatch[0];
          }
        }
        
        filename = title + ext;
      }
      console.log('📄 Filename:', filename);
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      console.log('🔗 Download URL created:', downloadUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      console.log('📎 Link element created, clicking...');
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log('✅ Download complete!');
    } catch (error) {
      console.error('❌ Download failed:', error);
      // Fallback: open in new tab
      console.log('🔄 Fallback: opening in new tab...');
      window.open(url, '_blank');
    }
  };



  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden" id="learning-content-area">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Progress ring */}
            <div className="relative h-10 w-10 flex-shrink-0">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted/40" />
                <circle
                  cx="18" cy="18" r="15.5"
                  stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"
                  className="text-primary transition-all"
                  strokeDasharray={`${(progressPercentage / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                {progressPercentage}%
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="font-semibold text-base md:text-lg line-clamp-1">
                {courseSummary.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {completedLessons}/{allLessons.length} bài hoàn thành
                {allLessons.length - completedLessons > 0 &&
                  ` · còn ${allLessons.length - completedLessons} bài`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {learningStreak && (
              <div
                className="hidden items-center gap-1.5 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50 px-3 py-1.5 text-sm font-semibold text-orange-700 shadow-sm md:flex"
                title="Learning streak"
              >
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                <span>{learningStreak.currentStreak ?? 0}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => onStartTour?.()}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Hướng dẫn
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? "Ẩn" : "Hiện"} danh sách
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1">
          {(() => {
            const lessonType = (currentLesson?.contentType || (currentLessonVideoUrl ? "VIDEO" : "TEXT")) as
              | "VIDEO" | "TEXT" | "QUIZ" | "CODING";
            const typeMeta: Record<string, { label: string; cls: string; icon: any }> = {
              VIDEO: { label: "VIDEO", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Video },
              TEXT: { label: "TEXT", cls: "bg-primary/10 text-primary border-primary/30", icon: FileText },
              QUIZ: { label: "QUIZ", cls: "bg-pink-50 text-pink-700 border-pink-200", icon: HelpCircle },
              CODING: { label: "CODE", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Code },
            };
            const meta = typeMeta[lessonType] || typeMeta.TEXT;
            const TypeIcon = meta.icon;
            const readMinutes = currentLesson?.estimatedDuration
              ? Math.max(1, Math.round(currentLesson.estimatedDuration / 60))
              : null;

            return (
              <>
                {/* VIDEO player only when there is a video URL */}
                {currentLessonVideoUrl && (
                  <div className="bg-black w-full" id="video-player-area">
                    <VideoPlayer
                      src={currentLessonVideoUrl}
                      title={currentLesson?.title}
                      subtitle={courseSummary?.instructorName}
                      onEnded={() => console.log("Video ended")}
                    />
                  </div>
                )}

                {/* Lesson Header (chip + title + meta) */}
                <div className="px-6 md:px-10 pt-8 pb-2 max-w-[820px] mx-auto w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider ${meta.cls}`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {meta.label}
                      {readMinutes && <span className="opacity-70">· {readMinutes} phút</span>}
                    </span>
                    {currentLesson?.hasExercise && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-orange-700">
                        <HelpCircle className="h-3.5 w-3.5" />
                        BÀI TẬP
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h1 className="text-3xl md:text-[34px] font-extrabold tracking-tight leading-tight flex-1">
                      {currentLesson?.title}
                    </h1>
                    <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" id="add-note-button">
                      <FileText className="h-4 w-4 mr-2" />
                      Ghi chú
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    {currentLesson?.chapterTitle && (
                      <>
                        <span className="font-medium text-foreground/80">{currentLesson.chapterTitle}</span>
                        <span className="mx-2">·</span>
                      </>
                    )}
                    Cập nhật{" "}
                    {currentLesson?.created
                      ? new Date(currentLesson.created).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </p>
                </div>

                {/* Lesson Article Body */}
                {currentLesson?.content && (
                  <div className="px-6 md:px-10 pb-8 max-w-[820px] mx-auto w-full">
                    <button
                      onClick={() => setShowContentDescription(!showContentDescription)}
                      className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          showContentDescription ? "rotate-90" : ""
                        }`}
                      />
                      {showContentDescription ? "Ẩn nội dung" : "Hiện nội dung"}
                    </button>
                    {showContentDescription && (
                      <article
                        className="prose prose-slate dark:prose-invert max-w-none
                          prose-headings:tracking-tight prose-headings:font-bold
                          prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl
                          prose-h3:mt-6 prose-h3:text-xl
                          prose-p:leading-[1.75] prose-p:text-[17px]
                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
                          prose-code:bg-primary/10 prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                          prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-lg
                          prose-img:rounded-xl prose-img:shadow-md
                          prose-hr:border-border"
                        dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                      />
                    )}
                  </div>
                )}

                {/* Empty state when no video + no content */}
                {!currentLessonVideoUrl && !currentLesson?.content && (
                  <div className="px-6 md:px-10 py-16 max-w-[820px] mx-auto w-full text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold mb-1">{currentLesson?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentLesson?.description || "Nội dung bài học đang được cập nhật."}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

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
                courseId={courseSummary?.id}
                lessonId={currentLesson?.id}
                exercises={exercises.map((exercise: any) => ({
                  id: exercise.id,
                  type: exercise.type,
                  question: exercise.question,
                  options: exercise.options,
                  testCases: exercise.testCases
                }))}
                lessonTitle={currentLesson?.title}
                lessonSlug={courseSummary?.slug}
                userAvatar={userAvatar}
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
                onNextLesson={() => {
                  // Navigate to next lesson if available
                  if (currentLessonIndex < allLessons.length - 1) {
                    onLessonChange(currentLessonIndex + 1);
                  }
                }}
              />
            )}
          </div>

          {/* DEBUG: Check currentLesson data */}
          {console.log('🔍 DEBUG currentLesson:', {
            hasLesson: !!currentLesson,
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            hasAssets: !!currentLesson?.assets,
            assetsLength: currentLesson?.assets?.length,
            assets: currentLesson?.assets
          })}

          {/* Lesson Assets/Resources */}
          {currentLesson?.assets && currentLesson.assets.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="font-semibold mb-3">Tài liệu & Link</h3>
              <div className="space-y-2">
                {currentLesson.assets.map((asset: any) => {
                  const assetUrl = normalizePersistedMediaUrl(asset.externalUrl || asset.url);
                  const isDocument = asset.assetType === 'DOCUMENT';
                  
                  // DEBUG: Log asset data
                  console.log('🔍 Asset data:', {
                    id: asset.id,
                    title: asset.title,
                    assetType: asset.assetType,
                    url: asset.url,
                    externalUrl: asset.externalUrl,
                    resolvedUrl: assetUrl,
                    allFields: Object.keys(asset)
                  });
                  
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded bg-primary/10">
                        {getAssetIcon(asset.assetType)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{asset.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{asset.assetType}</p>
                      </div>
                      {/* Download button for DOCUMENT type */}
                      {isDocument && assetUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownloadAsset(e, assetUrl, asset.title)}
                          title="Tải xuống"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {/* External link for non-document types */}
                      {!isDocument && assetUrl && (
                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Mở trong tab mới"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spacing for sticky navigation */}
          <div className="h-24"></div>
        </ScrollArea>

        {/* Navigation Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              {/* Bài trước */}
              <Button
                variant="ghost"
                disabled={currentLessonIndex === 0}
                onClick={() => onLessonChange(currentLessonIndex - 1)}
                className="flex-shrink-0 rounded-full font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                BÀI TRƯỚC
              </Button>

              {/* Hoàn thành + actions - Ở giữa */}
              <div className="flex items-center gap-2">
                {/* Mark Complete Button */}
                {isLessonCompleted(currentLesson?.id) ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold hidden sm:inline">Đã hoàn thành</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 font-semibold px-5"
                  >
                    <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Hoàn thành</span>
                  </Button>
                )}

                {/* Hỏi đáp */}
                <Button
                  onClick={() => setShowCommentModal(true)}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30"
                  id="qa-button"
                  title={commentT("openDiscussion")}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>

                {/* Bài tập */}
                <Button
                  onClick={() => {
                    const exerciseSection = document.getElementById("exercise-section");
                    if (exerciseSection) {
                      exerciseSection.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full border-2"
                  title="Bài tập"
                >
                  <BookOpenCheck className="h-4 w-4" />
                </Button>
              </div>

              {/* Bài tiếp theo */}
              <Button
                disabled={currentLessonIndex >= allLessons.length - 1}
                onClick={() => onLessonChange(currentLessonIndex + 1)}
                className="flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 font-semibold shadow-md shadow-primary/30 disabled:opacity-30"
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
              <h3 className="font-bold text-base">Nội dung khóa học</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Streak Card */}
            {learningStreak && (
              (learningStreak.currentStreak ?? 0) > 0 ? (
                <div className="relative overflow-hidden rounded-xl border border-orange-300/60 bg-gradient-to-br from-orange-100 via-pink-50 to-orange-50 dark:from-orange-950/40 dark:via-pink-950/30 dark:to-orange-950/20 p-3 shadow-sm">
                  <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-400/20 blur-xl" />
                  <div className="relative flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-200">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 shadow-md shadow-orange-500/40">
                        <Flame className="h-4 w-4 fill-white text-white" />
                      </span>
                      Streak học tập
                    </span>
                    <span className="text-lg font-extrabold text-orange-600 dark:text-orange-300">
                      {learningStreak.currentStreak} <span className="text-xs font-medium">ngày</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    Streak học tập
                  </span>
                  <span className="font-bold text-muted-foreground">0 ngày</span>
                </div>
              )
            )}

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  {completedLessons}/{allLessons.length} bài học
                </span>
                <span className="font-extrabold text-primary text-sm">{progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {completedLessons === allLessons.length
                  ? "🎉 Đã hoàn thành khóa học!"
                  : `Còn ${allLessons.length - completedLessons} bài để hoàn thành`}
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              <Accordion type="multiple" defaultValue={chapters.map((ch: any) => ch.id)} className="space-y-3">
                {chapters.map((chapter: any, chapterIndex: number) => {
                  const chapterLessons = chapter.lessons || [];
                  const completedCount = chapterLessons.filter((l: any) =>
                    isLessonCompleted(l.id)
                  ).length;
                  const chapterPct = chapterLessons.length
                    ? Math.round((completedCount / chapterLessons.length) * 100)
                    : 0;
                  const isChapterDone = completedCount === chapterLessons.length && chapterLessons.length > 0;

                  return (
                    <AccordionItem
                      key={chapter.id}
                      value={chapter.id}
                      className="border rounded-xl bg-card overflow-hidden shadow-sm"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40">
                        <div className="flex items-center gap-3 text-left flex-1">
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-full font-extrabold text-sm flex-shrink-0 ${
                              isChapterDone
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isChapterDone ? <CheckCircle2 className="h-4 w-4" /> : chapterIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{chapter.title}</h4>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-primary/80"
                                  style={{ width: `${chapterPct}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {completedCount}/{chapterLessons.length} · {chapterPct}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="space-y-1.5 pt-1">
                          {chapterLessons.map((lesson: any, lessonIndex: number) => {
                            const globalIndex = allLessons.findIndex((l) => l.id === lesson.id);
                            const isCompleted = isLessonCompleted(lesson.id);
                            const isLocked = !isCompleted && globalIndex > currentLessonIndex + 1;
                            const isCurrent = globalIndex === currentLessonIndex;
                            const isFirstLesson = globalIndex === 0;

                            const typeMeta: Record<string, { label: string; chip: string; Icon: any }> = {
                              VIDEO: { label: "Video", chip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300", Icon: Video },
                              TEXT: { label: "Text", chip: "bg-primary/10 text-primary border-primary/30", Icon: FileText },
                              QUIZ: { label: "Quiz", chip: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300", Icon: HelpCircle },
                              CODING: { label: "Code", chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300", Icon: Code },
                            };
                            const meta = typeMeta[lesson.contentType] || typeMeta.VIDEO;
                            const TypeIcon = meta.Icon;
                            const durationMin = lesson.estimatedDuration
                              ? Math.max(1, Math.round(lesson.estimatedDuration / 60))
                              : null;

                            return (
                              <button
                                key={lesson.id}
                                className={`group w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                                  isCurrent
                                    ? "bg-primary/8 border-primary shadow-sm ring-1 ring-primary/40"
                                    : isCompleted
                                    ? "border-transparent hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10"
                                    : "border-transparent hover:bg-muted/60"
                                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => !isLocked && onLessonChange(globalIndex)}
                                disabled={isLocked}
                                id={isFirstLesson ? "first-lesson" : globalIndex === 1 ? "second-lesson-locked" : undefined}
                              >
                                <div className="flex items-start gap-3">
                                  {/* State circle */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/40">
                                        <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
                                      </div>
                                    ) : isLocked ? (
                                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                    ) : isCurrent ? (
                                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/40">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                          {lessonIndex + 1}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Lesson info */}
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium line-clamp-2 mb-1.5 ${
                                        isCurrent ? "text-primary" : ""
                                      }`}
                                    >
                                      {lesson.title}
                                    </p>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${meta.chip}`}
                                      >
                                        <TypeIcon className="h-3 w-3" />
                                        {meta.label}
                                      </span>
                                      {durationMin && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          {durationMin}p
                                        </span>
                                      )}
                                      {lesson.hasExercise && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40">
                                          <HelpCircle className="h-2.5 w-2.5" />
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
              {commentT("lessonDiscussionTitle", { title: currentLesson?.title ?? "" })}
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
