"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GripVertical, 
  Plus, 
  Edit2, 
  Trash2,
  Video,
  FileText,
  Code,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  PlayCircle,
  Clock,
  File,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip,
  Upload,
  FolderOpen,
  Download,
  Eye
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import fileApiRequest from "@/apiRequests/file";
import {
  useGetCourseById,
  useGetLesson,
  useGetLessonExercise,
  useGetExercises,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useUpsertExerciseMutation,
  useCreateExercisesMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
} from "@/queries/useCourse";
import { 
  useGetExerciseDrafts,
  useGenerateExercisesMutation,
} from "@/queries/useAi";
import {
  CreateChapterBody,
  CreateChapterBodyType,
  UpdateChapterBody,
  UpdateChapterBodyType,
  CreateLessonBody,
  CreateLessonBodyType,
  UpdateLessonBody,
  UpdateLessonBodyType,
  CreateAssetBody,
  CreateAssetBodyType,
  UpdateAssetBody,
  UpdateAssetBodyType,
  CreateExerciseBody,
  CreateExerciseBodyType,
  UpdateExerciseBody,
  UpdateExerciseBodyType,
} from "@/schemaValidations/course.schema";
import TableSkeleton from "@/components/Skeleton";
import { useAccountProfile } from "@/queries/useAccount";
import AiExercisePanel from "@/app/manage/courses/[id]/ai-exercise-panel";

const RichTextEditor = dynamic(() => import("@/components/blog/rich-text-editor"), {
  ssr: false,
});

// Format duration helper
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const ContentTypeIcon = ({ type }: { type: string }) => {
  const icons = {
    VIDEO: <Video className="h-4 w-4 text-red-500" />,
    TEXT: <FileText className="h-4 w-4 text-blue-500" />,
    QUIZ: <HelpCircle className="h-4 w-4 text-purple-500" />,
    CODING: <Code className="h-4 w-4 text-green-500" />,
  };
  return icons[type as keyof typeof icons] || <FileText className="h-4 w-4" />;
};

const AssetTypeIcon = ({ type }: { type: string }) => {
  const icons = {
    VIDEO: <Video className="h-3 w-3 text-red-500" />,
    DOCUMENT: <File className="h-3 w-3 text-blue-500" />,
    LINK: <LinkIcon className="h-3 w-3 text-purple-500" />,
    IMAGE: <ImageIcon className="h-3 w-3 text-green-500" />,
    CODE: <Code className="h-3 w-3 text-orange-500" />,
  };
  return icons[type as keyof typeof icons] || <Paperclip className="h-3 w-3" />;
};

// Exercise Display Component
const ExerciseDisplay = ({ 
  courseId, 
  lessonId, 
  chapterId,
  hasExercise, 
  onEdit, 
  onDelete, 
  onCreate 
}: { 
  courseId: string; 
  lessonId: string; 
  chapterId: string;
  hasExercise?: boolean;
  onEdit?: (exercise: any) => void;
  onDelete?: (exercise: any) => void;
  onCreate?: () => void;
}) => {
  const t = useTranslations("ManageCourse");
  const { data: exercisesData, isLoading } = useGetExercises(courseId, lessonId);
  const exercises = exercisesData?.payload?.data || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">
          {t("Exercise")}
        </h4>
        {onCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCreate}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t("AddExercise")}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">{t("Loading") || "Đang tải..."}</p>
        </div>
      ) : exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((exercise: any) => (
            <div key={exercise.id} className="p-3 bg-background rounded border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <HelpCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {exercise.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : 
                       exercise.type === "CODING" ? "Lập trình" : 
                       exercise.type === "OPEN_ENDED" ? "Tự luận" : exercise.type}
                    </Badge>
                    <p className="text-sm font-medium">{exercise.question}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(exercise)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(exercise)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {/* MCQ Options */}
              {exercise.type === "MULTIPLE_CHOICE" && exercise.options?.choices && (
                <div className="space-y-2 pl-6">
              {exercise.options.choices.map((choice: any, idx: number) => (
                <div 
                  key={choice.id || idx}
                  className={`text-xs p-2 rounded flex items-start gap-2 ${
                    choice.isCorrect 
                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" 
                      : "bg-muted/50"
                  }`}
                >
                  <span className="font-semibold min-w-[20px]">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="flex-1">{choice.text}</span>
                      {choice.isCorrect && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          ✓ Đúng
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Test Cases */}
              {exercise.type === "CODING" && exercise.testCases && exercise.testCases.length > 0 && (
                <div className="space-y-2 pl-6">
              <p className="text-xs font-semibold text-muted-foreground">Test Cases:</p>
              {exercise.testCases.slice(0, 3).map((tc: any, idx: number) => (
                <div key={idx} className="text-xs p-2 rounded bg-muted/50">
                  <div className="flex gap-2">
                    <span className="font-semibold">Input:</span>
                    <code className="flex-1">{tc.input}</code>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="font-semibold">Expected:</span>
                    <code className="flex-1">{tc.expectedOutput}</code>
                  </div>
                </div>
              ))}
                  {exercise.testCases.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ {exercise.testCases.length - 3} more test cases</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            {t("NoExercise") || "Chưa có bài tập"}
          </p>
        </div>
      )}
    </div>
  );
};

export default function CourseContentManagementPage() {
  const params = useParams();
  const courseId = params.id as string;
  const t = useTranslations("ManageCourse");

  const { data: courseData, isLoading, refetch } = useGetCourseById(courseId);
  const createChapterMutation = useCreateChapterMutation();
  const updateChapterMutation = useUpdateChapterMutation();
  const deleteChapterMutation = useDeleteChapterMutation();
  const createLessonMutation = useCreateLessonMutation();
  const updateLessonMutation = useUpdateLessonMutation();
  const deleteLessonMutation = useDeleteLessonMutation();
  const createAssetMutation = useCreateAssetMutation();
  const updateAssetMutation = useUpdateAssetMutation();
  const deleteAssetMutation = useDeleteAssetMutation();
  const upsertExerciseMutation = useUpsertExerciseMutation();
  const createExercisesMutation = useCreateExercisesMutation();
  const updateExerciseMutation = useUpdateExerciseMutation();
  const deleteExerciseMutation = useDeleteExerciseMutation();
  const generateExercisesMutation = useGenerateExercisesMutation();
  
  const course = courseData?.payload?.data?.summary;
  const chapters = courseData?.payload?.data?.chapters || [];

  // Get all exercise drafts for this course
  const [allExerciseDrafts, setAllExerciseDrafts] = useState<unknown[]>([]);
  const [draftLessonIds, setDraftLessonIds] = useState<string[]>([]);

  // Collect all lesson IDs from chapters
  useEffect(() => {
    const lessonIds = chapters.flatMap((ch: { lessons?: { id: string }[] }) => 
      (ch.lessons || []).map(l => l.id)
    );
    setDraftLessonIds(lessonIds);
  }, [chapters]);

  // Fetch drafts for all lessons (simplified - in production, use a single API call)
  const firstLessonId = draftLessonIds[0] || "";
  const { data: draftsData, refetch: refetchDrafts } = useGetExerciseDrafts(firstLessonId);

  useEffect(() => {
    if (draftsData?.payload?.data) {
      setAllExerciseDrafts(draftsData.payload.data);
    }
  }, [draftsData]);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false); // ✅ Track drag state for smooth UI
  const [chapterDialog, setChapterDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: any }>({
    open: false,
    mode: 'create',
  });
  const [lessonDialog, setLessonDialog] = useState<{ 
    open: boolean; 
    mode: 'create' | 'edit'; 
    chapterId?: string;
    lessonId?: string;
    data?: any 
  }>({
    open: false,
    mode: 'create',
  });
  const [assetDialog, setAssetDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    chapterId?: string;
    lessonId?: string;
    data?: any;
  }>({
    open: false,
    mode: 'create',
  });
  const [exerciseDialog, setExerciseDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    chapterId?: string;
    lessonId?: string;
    data?: any;
  }>({
    open: false,
    mode: 'create',
  });

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const handleDragStart = () => {
    setIsDragging(true); // ✅ Start drag state for smooth UI
  };

  const handleDragEnd = async (result: DropResult) => {
    console.log('🎯 === DRAG END ===');
    console.log('Result:', result);
    
    setIsDragging(false); // ✅ End drag state
    
    if (!result.destination) {
      console.log('❌ No destination, drag cancelled');
      return;
    }

    const { source, destination, type } = result;
    
    // ✅ Skip if dropped in same position
    if (source.index === destination.index) {
      console.log('⏭️ Same position, skipping...');
      return;
    }
    
    console.log('📦 Drag type:', type);
    console.log('📍 Source index:', source.index);
    console.log('📍 Destination index:', destination.index);

    if (type === "CHAPTER") {
      // Get the chapters BEFORE reordering
      const sourceChapter = chapters[source.index];
      const destChapter = chapters[destination.index];

      console.log('📚 Source Chapter:', {
        id: sourceChapter.id,
        title: sourceChapter.title,
        currentOrder: sourceChapter.orderIndex,
        newOrder: destination.index + 1
      });
      console.log('📚 Dest Chapter:', {
        id: destChapter.id,
        title: destChapter.title,
        currentOrder: destChapter.orderIndex,
        newOrder: source.index + 1
      });

      try {
        console.log('🚀 Calling update APIs...');
        
        // ✅ SWAP orderIndex from DB, not array index
        const sourceChapterBody = {
          title: sourceChapter.title,
          description: sourceChapter.description || '',
          orderIndex: destChapter.orderIndex,  // ✅ Use dest's orderIndex from DB
        };
        
        const destChapterBody = {
          title: destChapter.title,
          description: destChapter.description || '',
          orderIndex: sourceChapter.orderIndex,  // ✅ Use source's orderIndex from DB
        };
        
        console.log('📤 Source chapter update body:', sourceChapterBody);
        console.log('📤 Dest chapter update body:', destChapterBody);
        
        // ⚠️ IMPORTANT: Update SEQUENTIALLY to avoid unique constraint violation
        // DB has UNIQUE constraint on (course_id, orderIndex)
        // Step 1: Move source to temporary position 0 (orderIndex starts from 1)
        console.log('🔄 Step 1: Moving source chapter to temp position 0...');
        await updateChapterMutation.mutateAsync({
          courseId,
          chapterId: sourceChapter.id,
          body: { ...sourceChapterBody, orderIndex: 0 },
        });
        
        // Step 2: Move dest to source's original position
        console.log('🔄 Step 2: Moving dest chapter to source position...');
        await updateChapterMutation.mutateAsync({
          courseId,
          chapterId: destChapter.id,
          body: destChapterBody,
        });
        
        // Step 3: Move source from temp to final position
        console.log('🔄 Step 3: Moving source chapter to final position...');
        await updateChapterMutation.mutateAsync({
          courseId,
          chapterId: sourceChapter.id,
          body: sourceChapterBody,
        });
        
        console.log('✅ Update successful, refetching...');
        // Refetch to see the changes
        await refetch();
        console.log('✅ Refetch complete!');
      } catch (error) {
        console.error('❌ Update failed:', error);
        handleErrorApi({ error });
      }
    } else if (type === "LESSON") {
      // Reorder lessons within a chapter - Only update the 2 swapped items
      // draggableId format: "chapterId-lessonId" where both are UUIDs
      // We need to extract chapterId from droppableId instead
      const droppableId = result.source.droppableId; // "lessons-{chapterId}"
      const chapterId = droppableId.replace('lessons-', '');
      
      console.log('📍 DroppableId:', droppableId);
      console.log('📍 Extracted ChapterId:', chapterId);
      
      const chapter = chapters.find((c: any) => c.id === chapterId);
      
      if (!chapter) {
        console.log('❌ Chapter not found:', chapterId);
        return;
      }

      // Get the lessons BEFORE reordering
      const sourceLesson = chapter.lessons[source.index];
      const destLesson = chapter.lessons[destination.index];

      console.log('📝 Source Lesson:', sourceLesson);
      console.log('📝 Dest Lesson:', destLesson);

      try {
        console.log('🚀 Calling update APIs...');
        
        // ✅ SWAP orderIndex from DB, not array index
        const sourceUpdateBody = { 
          title: sourceLesson.title,
          description: sourceLesson.description || '',
          contentType: sourceLesson.contentType || 'VIDEO',
          videoUrl: sourceLesson.videoUrl || '',
          estimatedDuration: sourceLesson.estimatedDuration || 0,
          orderIndex: destLesson.orderIndex,  // ✅ Use dest's orderIndex from DB
        };
        
        const destUpdateBody = { 
          title: destLesson.title,
          description: destLesson.description || '',
          contentType: destLesson.contentType || 'VIDEO',
          videoUrl: destLesson.videoUrl || '',
          estimatedDuration: destLesson.estimatedDuration || 0,
          orderIndex: sourceLesson.orderIndex,  // ✅ Use source's orderIndex from DB
        };
        
        console.log('� Source update body:', sourceUpdateBody);
        console.log('📤 Dest update body:', destUpdateBody);
        
        // ⚠️ IMPORTANT: Update SEQUENTIALLY to avoid unique constraint violation
        // DB has UNIQUE constraint on (chapter_id, orderIndex)
        // Step 1: Move source to temporary position 0 (orderIndex starts from 1)
        console.log('🔄 Step 1: Moving source to temp position 0...');
        await updateLessonMutation.mutateAsync({
          courseId,
          chapterId,
          lessonId: sourceLesson.id,
          body: { ...sourceUpdateBody, orderIndex: 0 },
        });
        
        // Step 2: Move dest to source's original position
        console.log('🔄 Step 2: Moving dest to source position...');
        await updateLessonMutation.mutateAsync({
          courseId,
          chapterId,
          lessonId: destLesson.id,
          body: destUpdateBody,
        });
        
        // Step 3: Move source from temp to final position
        console.log('🔄 Step 3: Moving source to final position...');
        await updateLessonMutation.mutateAsync({
          courseId,
          chapterId,
          lessonId: sourceLesson.id,
          body: sourceUpdateBody,
        });
        
        console.log('✅ Update successful, refetching...');
        // Refetch to see the changes immediately
        await refetch();
        console.log('✅ Refetch complete!');
      } catch (error) {
        console.error('❌ Update failed:', error);
        handleErrorApi({ error });
      }
    }
    
    console.log('🏁 === DRAG END COMPLETE ===\n');
  };

  const handleCreateChapter = async (data: CreateChapterBodyType) => {
    try {
      // Auto-calculate next order based on existing chapters
      const nextOrder = chapters.length + 1;
      const bodyWithOrder = { ...data, order: nextOrder };
      
      await createChapterMutation.mutateAsync({ courseId, body: bodyWithOrder });
      toast({
        title: t("Success"),
        description: t("ChapterCreated", { title: data.title }),
      });
      setChapterDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleUpdateChapter = async (data: UpdateChapterBodyType) => {
    if (!chapterDialog.data?.id) return;
    try {
      await updateChapterMutation.mutateAsync({
        courseId,
        chapterId: chapterDialog.data.id,
        body: data,
      });
      toast({
        title: t("Success"),
        description: t("ChapterUpdated", { title: data.title }),
      });
      setChapterDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (!confirm(t("DeleteChapterWarning", { title }))) return;
    try {
      await deleteChapterMutation.mutateAsync({ courseId, chapterId });
      toast({
        title: t("Success"),
        description: t("ChapterDeleted", { title }),
      });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleCreateLesson = async (data: CreateLessonBodyType) => {
    if (!lessonDialog.chapterId) return;
    try {
      // Auto-calculate next order based on existing lessons in chapter
      const chapter = chapters.find((c: any) => c.id === lessonDialog.chapterId);
      const nextOrder = (chapter?.lessons?.length || 0) + 1;
      const bodyWithOrder = { ...data, order: nextOrder };
      
      await createLessonMutation.mutateAsync({
        courseId,
        chapterId: lessonDialog.chapterId,
        body: bodyWithOrder,
      });
      toast({
        title: t("Success"),
        description: t("LessonCreated", { title: data.title }),
      });
      setLessonDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleUpdateLesson = async (data: UpdateLessonBodyType) => {
    if (!lessonDialog.chapterId || !lessonDialog.data?.id) return;
    try {
      // ✅ Preserve orderIndex from existing lesson data
      const updateBody = {
        ...data,
        orderIndex: lessonDialog.data.orderIndex, // Keep current order
      };
      
      await updateLessonMutation.mutateAsync({
        courseId,
        chapterId: lessonDialog.chapterId,
        lessonId: lessonDialog.data.id,
        body: updateBody,
      });
      toast({
        title: t("Success"),
        description: t("LessonUpdated", { title: data.title }),
      });
      setLessonDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string, title: string) => {
    if (!confirm(t("DeleteLessonWarning", { title }))) return;
    try {
      await deleteLessonMutation.mutateAsync({ courseId, chapterId, lessonId });
      toast({
        title: t("Success"),
        description: t("LessonDeleted", { title }),
      });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleCreateAsset = async (data: CreateAssetBodyType) => {
    if (!assetDialog.chapterId || !assetDialog.lessonId) return;
    try {
      // Auto-calculate next order based on existing assets in lesson
      const chapter = chapters.find((c: any) => c.id === assetDialog.chapterId);
      const lesson = chapter?.lessons?.find((l: any) => l.id === assetDialog.lessonId);
      const nextOrder = (lesson?.assets?.length || 0) + 1;
      const bodyWithOrder = { ...data, order: nextOrder };
      
      await createAssetMutation.mutateAsync({
        courseId,
        chapterId: assetDialog.chapterId,
        lessonId: assetDialog.lessonId,
        body: bodyWithOrder,
      });
      toast({
        title: t("Success"),
        description: t("AssetCreated", { title: data.title }),
      });
      setAssetDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleUpdateAsset = async (data: UpdateAssetBodyType) => {
    if (!assetDialog.chapterId || !assetDialog.lessonId || !assetDialog.data?.id) return;
    try {
      await updateAssetMutation.mutateAsync({
        courseId,
        chapterId: assetDialog.chapterId,
        lessonId: assetDialog.lessonId,
        assetId: assetDialog.data.id,
        body: data,
      });
      toast({
        title: t("Success"),
        description: t("AssetUpdated", { title: data.title }),
      });
      setAssetDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleDeleteAsset = async (chapterId: string, lessonId: string, assetId: string, title: string) => {
    if (!confirm(t("DeleteAssetWarning", { title }))) return;
    try {
      await deleteAssetMutation.mutateAsync({ courseId, chapterId, lessonId, assetId });
      toast({
        title: t("Success"),
        description: t("AssetDeleted", { title }),
      });
      refetch();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  // Download asset file - fetch as blob then download
  const handleDownloadAsset = async (url: string, title: string) => {
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
      
      toast({
        title: t("Success"),
        description: "Đã tải xuống file",
      });
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast({
        title: t("Error"),
        description: "Không thể tải file xuống",
        variant: "destructive",
      });
    }
  };

  // Preview asset file - open in new tab using Google Docs Viewer for documents
  const handlePreviewAsset = (url: string) => {
    // Get file extension from URL or try to detect type
    const urlLower = url.toLowerCase();
    
    // Check if it's a file type that browser can preview directly
    const browserPreviewable = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mp3', '.wav', '.txt'];
    const canPreviewDirectly = browserPreviewable.some(ext => urlLower.includes(ext));
    
    if (canPreviewDirectly) {
      // Browser can preview these directly
      window.open(url, '_blank');
    } else {
      // Use Google Docs Viewer for Word, Excel, PowerPoint, etc.
      const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      window.open(googleDocsViewerUrl, '_blank');
    }
  };

  const handleCreateExercise = async (data: CreateExerciseBodyType) => {
    console.log('➕ handleCreateExercise called with:', {
      data,
      exerciseDialog,
      courseId,
      lessonId: exerciseDialog.lessonId,
    });

    if (!exerciseDialog.chapterId || !exerciseDialog.lessonId) {
      console.error('❌ Missing required fields for create:', {
        hasChapterId: !!exerciseDialog.chapterId,
        hasLessonId: !!exerciseDialog.lessonId,
      });
      return;
    }

    // Get existing exercises for this lesson to calculate next orderIndex
    const lesson = chapters
      .find((ch: any) => ch.id === exerciseDialog.chapterId)
      ?.lessons?.find((l: any) => l.id === exerciseDialog.lessonId);
    
    const existingExercises = lesson?.exercises || [];
    const nextOrderIndex = existingExercises.length > 0
      ? Math.max(...existingExercises.map((ex: any) => ex.orderIndex || 0)) + 1
      : 1;
    
    // Auto-assign orderIndex
    const exerciseData = {
      ...data,
      orderIndex: nextOrderIndex,
    };

    try {
      console.log('📤 Calling createExercisesMutation with:', {
        courseId,
        lessonId: exerciseDialog.lessonId,
        body: [exerciseData],
        autoOrderIndex: nextOrderIndex,
      });

      await createExercisesMutation.mutateAsync({
        courseId,
        lessonId: exerciseDialog.lessonId,
        body: [exerciseData], // API expects array
      });

      console.log('✅ Exercise created successfully');
      toast({
        title: t("Success"),
        description: t("ExerciseCreated"),
      });
      setExerciseDialog({ open: false, mode: 'create' });
      refetch();
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      handleErrorApi({ error });
    }
  };

  const handleUpdateExercise = async (data: UpdateExerciseBodyType) => {
    console.log('🔧 === HANDLE UPDATE EXERCISE START ===');
    console.log('🔧 Input data received:', JSON.stringify(data, null, 2));
    console.log('🔧 Exercise dialog state:', {
      mode: exerciseDialog.mode,
      chapterId: exerciseDialog.chapterId,
      lessonId: exerciseDialog.lessonId,
      exerciseId: exerciseDialog.data?.id,
      exerciseData: JSON.stringify(exerciseDialog.data, null, 2),
    });
    console.log('🔧 Course ID:', courseId);

    // Validation with enhanced logging
    if (!exerciseDialog.chapterId || !exerciseDialog.lessonId || !exerciseDialog.data?.id) {
      console.error('❌ === VALIDATION FAILED ===');
      console.error('❌ Missing required fields:', {
        hasChapterId: !!exerciseDialog.chapterId,
        hasLessonId: !!exerciseDialog.lessonId,
        hasExerciseId: !!exerciseDialog.data?.id,
        chapterId: exerciseDialog.chapterId,
        lessonId: exerciseDialog.lessonId,
        exerciseId: exerciseDialog.data?.id,
      });
      return;
    }

    console.log('✅ Validation passed, proceeding with update...');

    try {
      // Enhanced data processing logging
      console.log('🔧 === PREPARING UPDATE PAYLOAD ===');
      console.log('🔧 Original exercise data from dialog:', JSON.stringify(exerciseDialog.data, null, 2));
      console.log('🔧 Form data to update with:', JSON.stringify(data, null, 2));
      
      // Log specific fields
      console.log('🔧 Exercise type:', data.type);
      console.log('🔧 Exercise question:', data.question);
      console.log('🔧 Preserving orderIndex:', exerciseDialog.data.orderIndex);
      
      // Enhanced options/testCases logging
      if (data.type === 'MULTIPLE_CHOICE' && data.options) {
        console.log('🔍 === MCQ OPTIONS PROCESSING ===');
        console.log('🔍 Options field type:', typeof data.options);
        console.log('🔍 Options raw value:', data.options);
        
        if (typeof data.options === 'string') {
          try {
            const parsedOptions = JSON.parse(data.options);
            console.log('🔍 Parsed options object:', JSON.stringify(parsedOptions, null, 2));
            console.log('🔍 Choices count:', parsedOptions.choices?.length || 0);
            console.log('🔍 Correct choices:', parsedOptions.choices?.filter((c: any) => c.isCorrect).length || 0);
          } catch (parseError) {
            console.error('❌ Failed to parse options JSON:', parseError);
          }
        }
      }
      
      if (data.type === 'CODING' && data.testCases) {
        console.log('💻 === CODING TEST CASES PROCESSING ===');
        console.log('💻 TestCases field type:', typeof data.testCases);
        console.log('💻 TestCases raw value:', data.testCases);
        
        if (typeof data.testCases === 'string') {
          try {
            const parsedTestCases = JSON.parse(data.testCases);
            console.log('💻 Parsed test cases:', JSON.stringify(parsedTestCases, null, 2));
            console.log('💻 Test cases count:', parsedTestCases.length || 0);
            console.log('💻 Public test cases:', parsedTestCases.filter((tc: any) => tc.visibility === 'PUBLIC').length || 0);
          } catch (parseError) {
            console.error('❌ Failed to parse testCases JSON:', parseError);
          }
        }
      }

      const updatePayload = {
        courseId,
        lessonId: exerciseDialog.lessonId,
        exerciseId: exerciseDialog.data.id,
        body: {
          ...data,
          orderIndex: exerciseDialog.data.orderIndex,
        },
      };
      
      console.log('📤 === FINAL API PAYLOAD ===');
      console.log('📤 Full payload object:', JSON.stringify(updatePayload, null, 2));
      console.log('📤 Payload body:', JSON.stringify(updatePayload.body, null, 2));
      console.log('📤 Payload size (chars):', JSON.stringify(updatePayload).length);
      console.log('📤 API endpoint info:', {
        courseId,
        lessonId: exerciseDialog.lessonId,
        exerciseId: exerciseDialog.data.id,
      });

      console.log('🚀 Making API call to updateExerciseMutation...');
      const result = await updateExerciseMutation.mutateAsync(updatePayload);
      
      console.log('✅ === UPDATE SUCCESSFUL ===');
      console.log('✅ API response:', JSON.stringify(result, null, 2));
      console.log('✅ Response status:', result?.status);
      console.log('✅ Response payload:', result?.payload);
      
      toast({
        title: t("Success"),
        description: t("ExerciseUpdated"),
      });
      
      console.log('🔄 Closing dialog and refreshing data...');
      setExerciseDialog({ open: false, mode: 'create' });
      refetch();
      console.log('✅ Update process completed successfully');
      
    } catch (error) {
      console.error('❌ === UPDATE FAILED ===');
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Enhanced error details
      if (error && typeof error === 'object') {
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        
        // Check for specific error types
        if ('response' in error) {
          console.error('❌ HTTP Response error:', (error as any).response);
          console.error('❌ Response status:', (error as any).response?.status);
          console.error('❌ Response data:', (error as any).response?.data);
        }
        
        if ('request' in error) {
          console.error('❌ Network request error:', (error as any).request);
        }
      }
      
      handleErrorApi({ error });
    }
    
    console.log('🏁 === HANDLE UPDATE EXERCISE END ===\n');
  };

  const handleDeleteExercise = async (chapterId: string, lessonId: string, exercise: any) => {
    console.log('🗑️ handleDeleteExercise called with:', {
      chapterId,
      lessonId,
      exercise,
      exerciseId: exercise?.id,
      courseId,
    });
    console.log('🗑️ Exercise object:', JSON.stringify(exercise, null, 2));

    if (!exercise?.id) {
      console.error('❌ Exercise ID is missing:', exercise);
      console.error('❌ Full exercise object:', JSON.stringify(exercise, null, 2));
      toast({
        title: t("Error"),
        description: "Exercise ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(t("DeleteExerciseWarning", { question: exercise.question }))) {
      console.log('⏸️ User cancelled delete');
      return;
    }

    try {
      const deletePayload = {
        courseId,
        lessonId,
        exerciseId: exercise.id,
      };
      
      console.log('📤 Calling deleteExerciseMutation with:', deletePayload);
      console.log('📤 Exercise to delete:', JSON.stringify(exercise, null, 2));

      const result = await deleteExerciseMutation.mutateAsync(deletePayload);

      console.log('✅ Exercise deleted successfully');
      console.log('✅ Delete result:', result);
      
      toast({
        title: t("Success"),
        description: t("ExerciseDeleted"),
      });
      refetch();
    } catch (error) {
      console.error('❌ Error deleting exercise:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      handleErrorApi({ error });
    }
  };

  const handleGenerateExercises = async (lessonId: string, lessonTitle: string) => {
    try {
      toast({
        title: "Generating exercises...",
        description: `Creating AI-generated exercises for "${lessonTitle}"`,
      });
      
      await generateExercisesMutation.mutateAsync({
        courseId,
        lessonId,
        type: "MCQ",
        difficulties: ["BEGINNER"],
        formats: ["MCQ"],
        count: 5,
        variants: 1,
        difficulty: "BEGINNER",
        language: "vi",
        includeExplanations: true,
        includeTestCases: true,
      });
      
      toast({
        title: t("Success"),
        description: "Exercises generated successfully!",
      });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (isLoading) {
    return <div className="p-6"><TableSkeleton /></div>;
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription className="mt-2">{course.description}</CardDescription>
            </div>
            <Button onClick={() => setChapterDialog({ open: true, mode: 'create' })}>
              <Plus className="h-4 w-4 mr-2" />
              {t("AddChapter")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("Chapters")}: </span>
              <span className="font-medium">{chapters.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Lessons")}: </span>
              <span className="font-medium">
                {chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Duration")}: </span>
              <span className="font-medium">
                {formatDuration(course.estimatedDuration || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Status")}: </span>
              <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag & Drop Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t("CourseContent")}</CardTitle>
          <CardDescription>{t("ManageChaptersLessonsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {chapters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("NoChaptersYet")}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setChapterDialog({ open: true, mode: 'create' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("AddChapter")}
              </Button>
            </div>
          ) : (
            <DragDropContext 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Droppable 
                droppableId="chapters" 
                type="CHAPTER" 
                isDropDisabled={false}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {chapters.map((chapter: any, index: number) => (
                      <Draggable
                        key={chapter.id || `chapter-${index}`}
                        draggableId={String(chapter.id || `chapter-${index}`)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg bg-background' : ''
                            }`}
                          >
                            {/* Chapter Header */}
                            <div className="flex items-center gap-3 p-4 bg-muted/30">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleChapter(chapter.id)}
                              >
                                {expandedChapters.has(chapter.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{chapter.title}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {chapter.lessons?.length || 0} {t("Lessons")}
                                  </Badge>
                                  {chapter.locked && (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                {chapter.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLessonDialog({
                                    open: true,
                                    mode: 'create',
                                    chapterId: chapter.id,
                                  })}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setChapterDialog({
                                    open: true,
                                    mode: 'edit',
                                    data: chapter,
                                  })}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Lessons List */}
                            {expandedChapters.has(chapter.id) && (
                              <div className="p-4 bg-background">
                                {(!chapter.lessons || chapter.lessons.length === 0) ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">{t("NoLessons")}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => setLessonDialog({
                                        open: true,
                                        mode: 'create',
                                        chapterId: chapter.id,
                                      })}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      {t("AddLesson")}
                                    </Button>
                                  </div>
                                ) : (
                                  <Droppable
                                    droppableId={`lessons-${chapter.id}`}
                                    type="LESSON"
                                    isDropDisabled={false}
                                    isCombineEnabled={false}
                                    ignoreContainerClipping={false}
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                      >
                                        {chapter.lessons.map((lesson: any, lessonIndex: number) => (
                                          <Draggable
                                            key={lesson.id || `lesson-${lessonIndex}`}
                                            draggableId={`${chapter.id}-${lesson.id || lessonIndex}`}
                                            index={lessonIndex}
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`border rounded-lg ${
                                                  snapshot.isDragging ? 'shadow-md bg-background' : ''
                                                }`}
                                              >
                                                {/* Lesson Header */}
                                                <div className={`flex items-center gap-3 p-3 ${
                                                  snapshot.isDragging ? '' : 'hover:bg-muted/50'
                                                }`}>
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab"
                                                  >
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                  </div>

                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleLesson(lesson.id)}
                                                  >
                                                    {expandedLessons.has(lesson.id) ? (
                                                      <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                      <ChevronRight className="h-3 w-3" />
                                                    )}
                                                  </Button>

                                                  <ContentTypeIcon type={lesson.contentType} />

                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-medium text-sm">
                                                        {lesson.title}
                                                      </span>
                                                      {lesson.isFree && (
                                                        <Badge variant="secondary" className="text-xs">
                                                          {t("Free")}
                                                        </Badge>
                                                      )}
                                                      {lesson.hasExercise && (
                                                        <Badge variant="default" className="text-xs bg-purple-500">
                                                          <HelpCircle className="h-3 w-3 mr-1" />
                                                          {t("Exercise")}
                                                        </Badge>
                                                      )}
                                                      {lesson.assets && lesson.assets.length > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                          <Paperclip className="h-3 w-3 mr-1" />
                                                          {lesson.assets.length}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    {lesson.estimatedDuration && (
                                                      <div className="flex items-center gap-1 mt-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                          {formatDuration(lesson.estimatedDuration)}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setAssetDialog({
                                                        open: true,
                                                        mode: 'create',
                                                        chapterId: chapter.id,
                                                        lessonId: lesson.id,
                                                      })}
                                                    >
                                                      <Plus className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setLessonDialog({
                                                        open: true,
                                                        mode: 'edit',
                                                        chapterId: chapter.id,
                                                        lessonId: lesson.id,
                                                        data: lesson,
                                                      })}
                                                    >
                                                      <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDeleteLesson(
                                                        chapter.id,
                                                        lesson.id,
                                                        lesson.title
                                                      )}
                                                    >
                                                      <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                  </div>
                                                </div>

                                                {/* Assets & Exercise List */}
                                                {expandedLessons.has(lesson.id) && (
                                                  <div className="px-12 py-3 bg-muted/30 border-t space-y-4">
                                                    {/* Exercise Section */}
                                                    <ExerciseDisplay 
                                                      courseId={courseId} 
                                                      lessonId={lesson.id}
                                                      chapterId={chapter.id}
                                                      hasExercise={lesson.hasExercise}
                                                      onCreate={() => setExerciseDialog({
                                                        open: true,
                                                        mode: 'create',
                                                        chapterId: chapter.id,
                                                        lessonId: lesson.id,
                                                      })}
                                                      onEdit={(exercise) => {
                                                        console.log('📝 === OPENING EXERCISE EDIT DIALOG ===');
                                                        console.log('📝 Exercise to edit:', JSON.stringify(exercise, null, 2));
                                                        console.log('📝 Exercise ID:', exercise.id);
                                                        console.log('📝 Exercise type:', exercise.type);
                                                        console.log('📝 Exercise question:', exercise.question);
                                                        console.log('📝 Exercise options (raw):', exercise.options);
                                                        console.log('📝 Exercise testCases (raw):', exercise.testCases);
                                                        console.log('📝 Exercise orderIndex:', exercise.orderIndex);
                                                        console.log('📝 Chapter ID:', chapter.id);
                                                        console.log('📝 Lesson ID:', lesson.id);
                                                        
                                                        setExerciseDialog({
                                                          open: true,
                                                          mode: 'edit',
                                                          chapterId: chapter.id,
                                                          lessonId: lesson.id,
                                                          data: exercise,
                                                        });
                                                        console.log('📝 Exercise dialog state set, opening...');
                                                      }}
                                                      onDelete={(exercise) => handleDeleteExercise(chapter.id, lesson.id, exercise)}
                                                    />

                                                    {/* Assets Section */}
                                                    <div className="space-y-2">
                                                      <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                                                          {t("Assets")}
                                                        </h4>
                                                      </div>
                                                    {(!lesson.assets || lesson.assets.length === 0) ? (
                                                      <div className="text-center py-2">
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                          {t("NoAssets")}
                                                        </p>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => setAssetDialog({
                                                            open: true,
                                                            mode: 'create',
                                                            chapterId: chapter.id,
                                                            lessonId: lesson.id,
                                                          })}
                                                        >
                                                          <Plus className="h-3 w-3 mr-1" />
                                                          {t("AddAsset")}
                                                        </Button>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-2">
                                                        {lesson.assets.map((asset: any) => (
                                                          <div
                                                            key={asset.id}
                                                            className="flex items-center gap-2 p-2 bg-background rounded border text-xs"
                                                          >
                                                            <AssetTypeIcon type={asset.assetType} />
                                                            <div className="flex-1">
                                                              <div className="font-medium">{asset.title}</div>
                                                              {asset.externalUrl && (
                                                                <a
                                                                  href={asset.externalUrl}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="text-blue-500 hover:underline truncate block"
                                                                >
                                                                  {asset.externalUrl}
                                                                </a>
                                                              )}
                                                            </div>
                                                            {/* Preview button for DOCUMENT type */}
                                                            {asset.assetType === 'DOCUMENT' && asset.externalUrl && (
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePreviewAsset(asset.externalUrl)}
                                                                title="Xem trước"
                                                              >
                                                                <Eye className="h-3 w-3 text-green-500" />
                                                              </Button>
                                                            )}
                                                            {/* Download button for DOCUMENT type */}
                                                            {asset.assetType === 'DOCUMENT' && asset.externalUrl && (
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadAsset(asset.externalUrl, asset.title)}
                                                                title="Tải xuống"
                                                              >
                                                                <Download className="h-3 w-3 text-blue-500" />
                                                              </Button>
                                                            )}
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => setAssetDialog({
                                                                open: true,
                                                                mode: 'edit',
                                                                chapterId: chapter.id,
                                                                lessonId: lesson.id,
                                                                data: asset,
                                                              })}
                                                            >
                                                              <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => handleDeleteAsset(
                                                                chapter.id,
                                                                lesson.id,
                                                                asset.id,
                                                                asset.title
                                                              )}
                                                            >
                                                              <Trash2 className="h-3 w-3 text-destructive" />
                                                            </Button>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Chapter Dialog */}
      <ChapterDialog
        open={chapterDialog.open}
        mode={chapterDialog.mode}
        data={chapterDialog.data}
        onClose={() => setChapterDialog({ open: false, mode: 'create' })}
        onCreate={handleCreateChapter}
        onUpdate={handleUpdateChapter}
      />

      {/* Lesson Dialog */}
      <LessonDialog
        open={lessonDialog.open}
        mode={lessonDialog.mode}
        courseId={courseId}
        chapterId={lessonDialog.chapterId}
        lessonId={lessonDialog.lessonId}
        data={lessonDialog.data}
        onClose={() => setLessonDialog({ open: false, mode: 'create' })}
        onCreate={handleCreateLesson}
        onUpdate={handleUpdateLesson}
      />

      {/* Asset Dialog */}
      <AssetDialog
        open={assetDialog.open}
        mode={assetDialog.mode}
        data={assetDialog.data}
        onClose={() => setAssetDialog({ open: false, mode: 'create' })}
        onCreate={handleCreateAsset}
        onUpdate={handleUpdateAsset}
      />

      {/* Exercise Dialog */}
      <ExerciseDialog
        open={exerciseDialog.open}
        mode={exerciseDialog.mode}
        data={exerciseDialog.data}
        onClose={() => setExerciseDialog({ open: false, mode: 'create' })}
        onCreate={handleCreateExercise}
        onUpdate={handleUpdateExercise}
      />

      {/* AI Exercise Generation Panel */}
      <Card>
        <CardContent className="pt-6">
          <AiExercisePanel 
            courseId={courseId} 
            chapters={chapters}
          />
        </CardContent>
      </Card>
    </main>
  );
}

// Chapter Dialog Component
function ChapterDialog({
  open,
  mode,
  data,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onCreate: (data: CreateChapterBodyType) => void;
  onUpdate: (data: UpdateChapterBodyType) => void;
}) {
  const t = useTranslations("ManageCourse");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateChapterBodyType>({
    resolver: zodResolver(CreateChapterBody) as any,
    defaultValues: data || {},
  });

  useEffect(() => {
    if (open) {
      reset(data || {});
    }
  }, [open, data, reset]);

  const onSubmit = (formData: CreateChapterBodyType) => {
    if (mode === 'create') {
      onCreate(formData);
    } else {
      onUpdate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("AddChapter") : t("EditChapter")}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t("AddChapterDescription") : t("EditChapterDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("Title")}</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t("ChapterTitlePlaceholder")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("Description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("ChapterDescriptionPlaceholder")}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="order">{t("Order")}</Label>
              <Input
                id="order"
                type="number"
                {...register("order", { valueAsNumber: true })}
                placeholder="1"
                min={1}
              />
              {errors.order && (
                <p className="text-sm text-destructive">{errors.order.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t(mode === 'create' ? "Creating" : "Updating") : t(mode === 'create' ? "Create" : "Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Exercise Dialog Component
function ExerciseDialog({
  open,
  mode,
  data,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onCreate: (data: CreateExerciseBodyType) => void;
  onUpdate: (data: UpdateExerciseBodyType) => void;
}) {
  const t = useTranslations("ManageCourse");
  
  // MCQ Choices state
  const [choices, setChoices] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: false },
  ]);

  // Test Cases state
  const [testCases, setTestCases] = useState<Array<{
    orderIndex: number;
    visibility: string;
    input: string;
    expectedOutput: string;
    weight: number;
    timeoutSeconds: number;
  }>>([{
    orderIndex: 1,
    visibility: 'PUBLIC',
    input: '',
    expectedOutput: '',
    weight: 10,
    timeoutSeconds: 2,
  }]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateExerciseBodyType | UpdateExerciseBodyType>({
    resolver: mode === 'create'
      ? (zodResolver(CreateExerciseBody) as any)
      : undefined, // Remove validation for edit mode temporarily
    defaultValues: data || { type: 'MULTIPLE_CHOICE', orderIndex: 1 },
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      console.log('🎯 === EXERCISE DIALOG OPENED ===');
      console.log('📊 Dialog mode:', mode);
      console.log('📊 Raw data received:', JSON.stringify(data, null, 2));
      
      if (data) {
        console.log('📝 === EDIT MODE - PROCESSING DATA ===');
        console.log('📝 Exercise type:', data.type);
        console.log('📝 Exercise question:', data.question);
        console.log('📝 Exercise orderIndex:', data.orderIndex);
        
        // Enhanced debugging for options/choices
        if (data.type === 'MULTIPLE_CHOICE') {
          console.log('🔍 === PROCESSING MCQ DATA ===');
          console.log('🔍 Raw options field:', data.options);
          console.log('🔍 Type of options:', typeof data.options);
          
          let parsedChoices;
          try {
            if (typeof data.options === 'string') {
              console.log('📜 Parsing options from JSON string...');
              const parsed = JSON.parse(data.options);
              console.log('📜 Parsed options object:', JSON.stringify(parsed, null, 2));
              parsedChoices = parsed.choices || [];
            } else if (data.options && data.options.choices) {
              console.log('📦 Using options.choices directly...');
              parsedChoices = data.options.choices;
            } else {
              console.log('❌ No valid choices found, using default');
              parsedChoices = [{ text: '', isCorrect: false }];
            }
            
            console.log('✅ Final parsed choices:', JSON.stringify(parsedChoices, null, 2));
            console.log('✅ Choices count:', parsedChoices.length);
            setChoices(parsedChoices);
            
          } catch (error) {
            console.error('❌ Error parsing choices:', error);
            console.error('❌ Problematic options data:', data.options);
            setChoices([{ text: '', isCorrect: false }]);
          }
        }
        
        // Enhanced debugging for test cases
        if (data.type === 'CODING') {
          console.log('💻 === PROCESSING CODING DATA ===');
          console.log('💻 Raw testCases field:', data.testCases);
          console.log('💻 Type of testCases:', typeof data.testCases);
          
          let parsedTestCases;
          try {
            if (typeof data.testCases === 'string') {
              console.log('📜 Parsing testCases from JSON string...');
              parsedTestCases = JSON.parse(data.testCases);
            } else if (Array.isArray(data.testCases)) {
              console.log('📋 Using testCases array directly...');
              parsedTestCases = data.testCases;
            } else {
              console.log('❌ No valid test cases found, using default');
              parsedTestCases = [{
                orderIndex: 1,
                visibility: 'PUBLIC',
                input: '',
                expectedOutput: '',
                weight: 10,
                timeoutSeconds: 2,
              }];
            }
            
            console.log('✅ Final parsed test cases:', JSON.stringify(parsedTestCases, null, 2));
            console.log('✅ Test cases count:', parsedTestCases.length);
            setTestCases(parsedTestCases);
            
          } catch (error) {
            console.error('❌ Error parsing test cases:', error);
            console.error('❌ Problematic testCases data:', data.testCases);
            setTestCases([{
              orderIndex: 1,
              visibility: 'PUBLIC',
              input: '',
              expectedOutput: '',
              weight: 10,
              timeoutSeconds: 2,
            }]);
          }
        }
        
        console.log('📝 Calling form reset with data...');
        reset(data);
        console.log('✅ Form reset completed');
        
      } else {
        console.log('➕ === CREATE MODE - USING DEFAULTS ===');
        const defaultData = { type: 'MULTIPLE_CHOICE' as const, orderIndex: 1 };
        console.log('➕ Default data:', JSON.stringify(defaultData, null, 2));
        
        reset(defaultData);
        setChoices([{ text: '', isCorrect: false }]);
        setTestCases([{
          orderIndex: 1,
          visibility: 'PUBLIC',
          input: '',
          expectedOutput: '',
          weight: 10,
          timeoutSeconds: 2,
        }]);
        console.log('✅ Create mode initialization completed');
      }
      console.log('🏁 === DIALOG SETUP COMPLETE ===\n');
    }
  }, [open, data, reset]);

  const onSubmit = (formData: CreateExerciseBodyType | UpdateExerciseBodyType) => {
    console.log('🚀 === EXERCISE FORM SUBMISSION (FIXED) ===');
    console.log('🚀 Form mode:', mode);
    console.log('🚀 Raw form data:', JSON.stringify(formData, null, 2));
    console.log('🚀 Exercise type:', exerciseType);
    console.log('🚀 Current choices state:', JSON.stringify(choices, null, 2));
    console.log('🚀 Current testCases state:', JSON.stringify(testCases, null, 2));

    // Clone formData to avoid mutation
    const payload = { ...formData };
    
    // Ensure orderIndex is set
    if (!payload.orderIndex && data?.orderIndex) {
      payload.orderIndex = data.orderIndex;
    }
    if (!payload.orderIndex) {
      payload.orderIndex = 1;
    }

    // Enhanced debugging for options building
    if (exerciseType === 'MULTIPLE_CHOICE') {
      console.log('🔧 === BUILDING MCQ OPTIONS (FIXED) ===');
      console.log('🔧 Choices to stringify:', JSON.stringify(choices, null, 2));
      console.log('🔧 Valid choices count:', choices.filter(c => c.text.trim()).length);
      console.log('🔧 Correct choices count:', choices.filter(c => c.isCorrect).length);
      
      const optionsObject = { choices };
      const optionsJson = JSON.stringify(optionsObject);
      console.log('🔧 Options object:', JSON.stringify(optionsObject, null, 2));
      console.log('🔧 Options JSON string:', optionsJson);
      console.log('🔧 Options JSON string length:', optionsJson.length);
      
      (payload as any).options = optionsJson;
      console.log('✅ Options field set in payload');
    }
    
    // Enhanced debugging for test cases building
    if (exerciseType === 'CODING') {
      console.log('💻 === BUILDING CODING TEST CASES (FIXED) ===');
      console.log('💻 Test cases to stringify:', JSON.stringify(testCases, null, 2));
      console.log('💻 Valid test cases count:', testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim()).length);
      console.log('💻 Public test cases count:', testCases.filter(tc => tc.visibility === 'PUBLIC').length);
      console.log('💻 Private test cases count:', testCases.filter(tc => tc.visibility === 'PRIVATE').length);
      
      const testCasesJson = JSON.stringify(testCases);
      console.log('💻 Test cases JSON string:', testCasesJson);
      console.log('💻 Test cases JSON string length:', testCasesJson.length);
      
      (payload as any).testCases = testCasesJson;
      console.log('✅ TestCases field set in payload');
    }

    console.log('📤 === FINAL SUBMISSION PAYLOAD (FIXED) ===');
    console.log('📤 Final payload:', JSON.stringify(payload, null, 2));
    console.log('📤 Payload size (chars):', JSON.stringify(payload).length);

    try {
      if (mode === 'create') {
        console.log('➕ Calling onCreate with payload...');
        onCreate(payload as CreateExerciseBodyType);
      } else {
        console.log('🔧 Calling onUpdate with payload...');
        onUpdate(payload as UpdateExerciseBodyType);
      }
      console.log('✅ Form submission call completed');
    } catch (error) {
      console.error('❌ Error in form submission:', error);
    }
    
    console.log('🏁 === FORM SUBMISSION COMPLETE (FIXED) ===\n');
  };

  const exerciseType = watch("type");

  // MCQ Choice handlers
  const addChoice = () => {
    setChoices([...choices, { text: '', isCorrect: false }]);
  };

  const removeChoice = (index: number) => {
    if (choices.length > 1) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const updateChoiceText = (index: number, text: string) => {
    const newChoices = [...choices];
    newChoices[index].text = text;
    setChoices(newChoices);
  };

  const toggleChoiceCorrect = (index: number) => {
    const newChoices = [...choices];
    newChoices[index].isCorrect = !newChoices[index].isCorrect;
    setChoices(newChoices);
  };

  // Test Case handlers
  const addTestCase = () => {
    setTestCases([...testCases, {
      orderIndex: testCases.length + 1,
      visibility: 'PUBLIC',
      input: '',
      expectedOutput: '',
      weight: 10,
      timeoutSeconds: 2,
    }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      const newTestCases = testCases.filter((_, i) => i !== index);
      // Re-index
      newTestCases.forEach((tc, i) => tc.orderIndex = i + 1);
      setTestCases(newTestCases);
    }
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const newTestCases = [...testCases];
    (newTestCases[index] as any)[field] = value;
    setTestCases(newTestCases);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("AddExercise") || "Add Exercise" : t("EditExercise") || "Edit Exercise"}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t("AddExerciseDescription") || "Create a new exercise for this lesson"
              : t("EditExerciseDescription") || "Modify the exercise details"}
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={(e) => {
            console.log('📋 === FORM SUBMIT EVENT TRIGGERED ===');
            console.log('📋 Event type:', e.type);
            console.log('📋 Form valid?', (e.target as HTMLFormElement).checkValidity());
            console.log('📋 Mode:', mode);
            console.log('📋 Is submitting:', isSubmitting);
            console.log('📋 Form errors before submit:', JSON.stringify(errors, null, 2));
            console.log('📋 Calling handleSubmit wrapper...');
            
            // Call the handleSubmit wrapper with error handling
            const submitHandler = handleSubmit(
              onSubmit,
              (validationErrors) => {
                console.log('❌ === FORM VALIDATION FAILED ===');
                console.log('❌ Validation errors:', JSON.stringify(validationErrors, null, 2));
                console.log('❌ Number of errors:', Object.keys(validationErrors).length);
                
                Object.keys(validationErrors).forEach(key => {
                  const error = (validationErrors as any)[key];
                  console.log(`❌ Field '${key}' error:`, error?.message);
                  console.log(`❌ Field '${key}' type:`, error?.type);
                  console.log(`❌ Field '${key}' full error:`, error);
                });
                
                // Also log current form values
                const formValues = getValues();
                console.log('📊 Current form values:', JSON.stringify(formValues, null, 2));
                console.log('📊 Exercise type from form:', formValues.type);
                console.log('📊 Question from form:', formValues.question);
                console.log('📊 OrderIndex from form:', formValues.orderIndex);
              }
            );
            
            submitHandler(e);
            
            console.log('📋 handleSubmit wrapper called');
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t("ExerciseTypeLabel") || "Type"}</Label>
              <Select
                value={exerciseType}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">
                    {t("ExerciseType.MULTIPLE_CHOICE") || "Multiple Choice"}
                  </SelectItem>
                  <SelectItem value="CODING">
                    {t("ExerciseType.CODING") || "Coding"}
                  </SelectItem>
                  <SelectItem value="OPEN_ENDED">
                    {t("ExerciseType.OPEN_ENDED") || "Open Ended"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{String(errors.type.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderIndex">{t("Order") || "Order"}</Label>
              <Input
                id="orderIndex"
                type="number"
                {...register("orderIndex", { valueAsNumber: true })}
                placeholder={t("AutoGenerated") || "Auto-generated"}
                min={1}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("OrderAutoHint") || "Order will be auto-assigned based on existing exercises"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">{t("QuestionLabel") || "Question"}</Label>
            <Textarea
              id="question"
              {...register("question")}
              placeholder={t("ExerciseQuestionPlaceholder") || "Enter the exercise question..."}
              rows={4}
            />
            {errors.question && (
              <p className="text-sm text-destructive">{String(errors.question.message)}</p>
            )}
          </div>

          {/* Multiple Choice Options */}
          {exerciseType === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("ChoicesLabel") || "Choices"}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addChoice}>
                  <Plus className="h-3 w-3 mr-1" />
                  {t("AddChoice") || "Add Choice"}
                </Button>
              </div>
              
              <div className="space-y-2">
                {choices.map((choice, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                    <span className="text-sm font-semibold mt-2 min-w-[24px]">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      value={choice.text}
                      onChange={(e) => updateChoiceText(index, e.target.value)}
                      placeholder={t("ChoicePlaceholder") || "Enter choice..."}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={choice.isCorrect ? "default" : "outline"}
                      onClick={() => toggleChoiceCorrect(index)}
                      className={choice.isCorrect ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {choice.isCorrect ? "✓ Correct" : "Mark Correct"}
                    </Button>
                    {choices.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChoice(index)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t("ChoicesHint") || "Add at least one choice and mark the correct answer(s)"}
              </p>
            </div>
          )}

          {/* Coding Test Cases */}
          {exerciseType === "CODING" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("TestCasesLabel") || "Test Cases"}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addTestCase}>
                  <Plus className="h-3 w-3 mr-1" />
                  {t("AddTestCase") || "Add Test Case"}
                </Button>
              </div>
              
              <div className="space-y-3">
                {testCases.map((testCase, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Test Case #{testCase.orderIndex}</Badge>
                      {testCases.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("Visibility") || "Visibility"}</Label>
                        <Select
                          value={testCase.visibility}
                          onValueChange={(value) => updateTestCase(index, 'visibility', value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                            <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">{t("Weight") || "Weight"}</Label>
                        <Input
                          type="number"
                          value={testCase.weight}
                          onChange={(e) => updateTestCase(index, 'weight', Number(e.target.value))}
                          className="h-8 text-xs"
                          min={0}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t("Input") || "Input"}</Label>
                      <Input
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        placeholder="5"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t("ExpectedOutput") || "Expected Output"}</Label>
                      <Input
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        placeholder="25"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t("TimeoutSeconds") || "Timeout (seconds)"}</Label>
                      <Input
                        type="number"
                        value={testCase.timeoutSeconds}
                        onChange={(e) => updateTestCase(index, 'timeoutSeconds', Number(e.target.value))}
                        className="h-8 text-xs"
                        min={1}
                        max={30}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t("TestCasesHint") || "Test cases will be numbered automatically. PUBLIC cases are visible to students."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel") || "Cancel"}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={() => {
                console.log('🔘 === SUBMIT BUTTON CLICKED ===');
                console.log('🔘 Mode:', mode);
                console.log('🔘 Is submitting:', isSubmitting);
                console.log('🔘 Form errors count:', Object.keys(errors).length);
                console.log('🔘 Form errors:', JSON.stringify(errors, null, 2));
                console.log('🔘 Exercise type:', exerciseType);
                console.log('🔘 Button disabled?', isSubmitting);
                
                // Detailed error analysis
                if (Object.keys(errors).length > 0) {
                  console.log('❌ === FORM VALIDATION ERRORS DETECTED ===');
                  Object.keys(errors).forEach(key => {
                    console.log(`❌ Error in field '${key}':`, errors[key as keyof typeof errors]);
                    console.log(`❌ Error message:`, (errors[key as keyof typeof errors] as any)?.message);
                  });
                }
                
                console.log('🔘 About to trigger form submission...');
              }}
            >
              {isSubmitting
                ? t(mode === 'create' ? "Creating" : "Updating")
                : t(mode === 'create' ? "Create" : "Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Lesson Dialog Component
function LessonDialog({
  open,
  mode,
  courseId,
  chapterId,
  lessonId,
  data,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  courseId: string;
  chapterId?: string;
  lessonId?: string;
  data?: any;
  onClose: () => void;
  onCreate: (data: CreateLessonBodyType) => void;
  onUpdate: (data: UpdateLessonBodyType) => void;
}) {
  const t = useTranslations("ManageCourse");
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  // Fetch lesson data when in edit mode
  const { data: lessonData, isLoading, error } = useGetLesson(
    courseId,
    chapterId || '',
    lessonId || '',
  );

  // Debug log
  useEffect(() => {
    if (mode === 'edit') {
      console.log('🔍 GET LESSON DEBUG:', {
        courseId,
        chapterId,
        lessonId,
        isLoading,
        hasData: !!lessonData,
        lessonData: lessonData?.payload?.data,
        error,
      });
    }
  }, [mode, courseId, chapterId, lessonId, lessonData, isLoading, error]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLessonBodyType | UpdateLessonBodyType>({
    resolver: mode === 'create' 
      ? (zodResolver(CreateLessonBody) as any)
      : (zodResolver(UpdateLessonBody) as any),
    defaultValues: data || { contentType: 'VIDEO', isFree: false },
  });

  useEffect(() => {
    if (open && mode === 'edit' && lessonData?.payload?.data) {
      const backendData = lessonData.payload.data;
      console.log('✅ Resetting form with fetched data:', backendData);
      
      // Map backend fields to form fields
      const formData = {
        title: backendData.title || '',
        description: backendData.description || '',
        contentType: backendData.contentType || 'VIDEO',
        content: backendData.content || '',
        duration: backendData.estimatedDuration || 0, // Backend uses estimatedDuration
        videoUrl: backendData.videoUrl || '', // Video URL for VIDEO type
        isFree: backendData.isFree ?? false,
      };
      
      console.log('📝 Mapped form data:', formData);
      reset(formData);
      
      // Force set contentType for Select component
      setValue('contentType', backendData.contentType || 'VIDEO');
      setValue('isFree', backendData.isFree ?? false);
    } else if (open && mode === 'create') {
      console.log('➕ Resetting form with default values');
      // Use default values for create mode
      reset(data || { contentType: 'VIDEO', isFree: false, videoUrl: '' });
    }
  }, [open, mode, lessonData, data, reset, setValue]);

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({ 
        title: t("Error") || "Error", 
        description: "Please select a video file", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 100MB for videos)
    if (file.size > 100 * 1024 * 1024) {
      toast({ 
        title: t("Error") || "Error", 
        description: "File size must be less than 100MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fileApiRequest.uploadFile(formData);
      const videoUrl = response.payload.data.cloudinarySecureUrl;
      
      setValue('videoUrl', videoUrl);
      toast({ 
        title: t("Success") || "Success", 
        description: t("VideoUploaded") || "Video uploaded successfully" 
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: t("Error") || "Error", 
        description: error?.message || "Failed to upload video", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaSelect = (fileUrl: string) => {
    setValue('videoUrl', fileUrl);
    setShowMediaLibrary(false);
    toast({ 
      title: t("Success") || "Success", 
      description: t("VideoSelected") || "Video selected from library" 
    });
  };

  const onSubmit = (formData: any) => {
    if (mode === 'create') {
      // Map frontend field names to backend field names for CREATE
      const createData: CreateLessonBodyType = {
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        content: formData.content,
        duration: formData.duration, // Frontend uses 'duration', backend maps to 'estimatedDuration'
        orderIndex: formData.order, // Map 'order' to 'orderIndex'
        isFree: formData.isFree ?? false,
        videoUrl: formData.videoUrl,
      };
      onCreate(createData);
    } else {
      // Map frontend field names to backend field names for UPDATE
      const updateData: UpdateLessonBodyType = {
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        content: formData.content,
        estimatedDuration: formData.duration, // Backend expects estimatedDuration
        isFree: formData.isFree,
        videoUrl: formData.videoUrl,
      };
      onUpdate(updateData);
    }
  };

  const contentType = watch("contentType");
  const isFree = watch("isFree");
  const videoUrl = watch("videoUrl");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("AddLesson") : t("EditLesson")}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t("AddLessonDescription") : t("EditLessonDescription")}
          </DialogDescription>
        </DialogHeader>
        {mode === 'edit' && isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t("Loading")}...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("Title")}</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t("LessonTitlePlaceholder")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("Description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("LessonDescriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">{t("ContentTypeLabel")}</Label>
              <Select
                value={contentType}
                onValueChange={(value) => setValue("contentType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">{t("ContentType.VIDEO")}</SelectItem>
                  <SelectItem value="TEXT">{t("ContentType.TEXT")}</SelectItem>
                  <SelectItem value="QUIZ">{t("ContentType.QUIZ")}</SelectItem>
                  <SelectItem value="CODING">{t("ContentType.CODING")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{t("DurationLabel")} (seconds)</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { valueAsNumber: true })}
                placeholder="600"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("ContentLabel")}</Label>
            <RichTextEditor
              value={watch("content") || ""}
              onChange={(value) => setValue("content", value)}
              placeholder={t("ContentPlaceholder") || "Write lesson content..."}
            />
            <p className="text-xs text-muted-foreground">{t("ContentHint")}</p>
          </div>

          {/* Video URL field - show only when contentType is VIDEO */}
          {contentType === 'VIDEO' && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">{t("VideoURL")}</Label>
              <div className="space-y-2">
                {videoUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="h-full w-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    id="videoUrl"
                    {...register("videoUrl")}
                    placeholder="https://www.youtube.com/watch?v=... or upload below"
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? t("Uploading") || "Uploading..." : t("Upload") || "Upload"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaLibrary(true)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {t("Library") || "Library"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("VideoURLHint") || "Enter YouTube, Vimeo, or direct video URL, or upload from computer/library"}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className={`flex items-center space-x-2 ${mode === 'create' ? 'col-span-2' : 'pt-8'}`}>
              <Switch
                id="isFree"
                checked={isFree}
                onCheckedChange={(checked) => setValue("isFree", checked)}
              />
              <Label htmlFor="isFree">{t("IsFreeLesson")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t(mode === 'create' ? "Creating" : "Updating") : t(mode === 'create' ? "Create" : "Update")}
            </Button>
          </DialogFooter>
        </form>
        )}
        
        {/* Media Library Dialog for Video Selection */}
        <MediaLibraryDialog
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectFile={(file) => handleMediaSelect(file.cloudinarySecureUrl)}
          userId={userId}
          mediaType="VIDEO"
          title={t("SelectVideoFromLibrary") || "Select Video from Library"}
        />
      </DialogContent>
    </Dialog>
  );
}

// Asset Dialog Component
function AssetDialog({
  open,
  mode,
  data,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onCreate: (data: CreateAssetBodyType) => void;
  onUpdate: (data: UpdateAssetBodyType) => void;
}) {
  const t = useTranslations("ManageCourse");
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssetBodyType | UpdateAssetBodyType>({
    resolver: zodResolver(mode === 'create' ? CreateAssetBody : UpdateAssetBody) as any,
    defaultValues: data || { assetType: 'DOCUMENT' },
  });

  useEffect(() => {
    if (open) {
      reset(data || { assetType: 'DOCUMENT' });
    }
  }, [open, data, reset]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const assetTypeValue = watch("assetType");
    
    // Validate file type based on asset type
    if (assetTypeValue === 'VIDEO' && !file.type.startsWith('video/')) {
      toast({ 
        title: t("Error") || "Error", 
        description: "Please select a video file", 
        variant: "destructive" 
      });
      return;
    }
    
    if (assetTypeValue === 'IMAGE' && !file.type.startsWith('image/')) {
      toast({ 
        title: t("Error") || "Error", 
        description: "Please select an image file", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({ 
        title: t("Error") || "Error", 
        description: "File size must be less than 100MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fileApiRequest.uploadFile(formData);
      const fileUrl = response.payload.data.cloudinarySecureUrl;
      const originalName = response.payload.data.originalName || file.name;
      
      setValue('externalUrl', fileUrl);
      
      // Auto-fill title with original filename if title is empty
      const currentTitle = watch('title');
      if (!currentTitle || currentTitle.trim() === '') {
        setValue('title', originalName);
      }
      
      toast({ 
        title: t("Success") || "Success", 
        description: t("FileUploaded") || "File uploaded successfully" 
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: t("Error") || "Error", 
        description: error?.message || "Failed to upload file", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaSelect = (file: any) => {
    setValue('externalUrl', file.cloudinarySecureUrl);
    
    // Auto-fill title with original filename if title is empty
    const currentTitle = watch('title');
    if (!currentTitle || currentTitle.trim() === '') {
      setValue('title', file.originalName || file.name);
    }
    
    setShowMediaLibrary(false);
    toast({ 
      title: t("Success") || "Success", 
      description: t("FileSelected") || "File selected from library" 
    });
  };

  const onSubmit = (formData: CreateAssetBodyType | UpdateAssetBodyType) => {
    if (mode === 'create') {
      onCreate(formData as CreateAssetBodyType);
    } else {
      onUpdate(formData as UpdateAssetBodyType);
    }
  };

  const assetType = watch("assetType");
  const externalUrl = watch("externalUrl");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("AddAsset") : t("EditAsset")}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t("AddAssetDescription") : t("EditAssetDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetType">{t("AssetTypeLabel")}</Label>
              <Select
                value={assetType}
                onValueChange={(value) => setValue("assetType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">{t("AssetType.VIDEO")}</SelectItem>
                  <SelectItem value="DOCUMENT">{t("AssetType.DOCUMENT")}</SelectItem>
                  <SelectItem value="LINK">{t("AssetType.LINK")}</SelectItem>
                  <SelectItem value="IMAGE">{t("AssetType.IMAGE")}</SelectItem>
                  <SelectItem value="CODE">{t("AssetType.CODE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label htmlFor="orderIndex">{t("Order")}</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  {...register("orderIndex", { valueAsNumber: true })}
                  placeholder="1"
                  min={1}
                />
                {errors.orderIndex && (
                  <p className="text-sm text-destructive">{errors.orderIndex.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("Title")}</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t("AssetTitlePlaceholder")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">{t("URLLabel")}</Label>
            <div className="space-y-2">
              {/* Preview based on asset type */}
              {externalUrl && assetType === 'VIDEO' && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <video 
                    src={externalUrl} 
                    controls 
                    className="h-full w-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {externalUrl && assetType === 'IMAGE' && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <img 
                    src={externalUrl} 
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              {externalUrl && assetType === 'DOCUMENT' && (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <a 
                    href={externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-2"
                  >
                    <File className="h-4 w-4" />
                    {externalUrl.split('/').pop() || 'Document'}
                  </a>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  id="externalUrl"
                  {...register("externalUrl")}
                  placeholder="https://example.com/file.pdf or upload below"
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    assetType === 'VIDEO' ? 'video/*' :
                    assetType === 'IMAGE' ? 'image/*' :
                    assetType === 'DOCUMENT' ? '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx' :
                    '*'
                  }
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? t("Uploading") || "Uploading..." : t("Upload") || "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaLibrary(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t("Library") || "Library"}
                </Button>
              </div>
              {errors.externalUrl && (
                <p className="text-sm text-destructive">{errors.externalUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {assetType === 'VIDEO' && (t("VideoAssetHint") || "Upload video file or enter URL")}
                {assetType === 'IMAGE' && (t("ImageAssetHint") || "Upload image file or enter URL")}
                {assetType === 'DOCUMENT' && (t("DocumentAssetHint") || "Upload document or enter URL")}
                {assetType === 'LINK' && (t("LinkAssetHint") || "Enter external link URL")}
                {assetType === 'CODE' && (t("CodeAssetHint") || "Enter code repository or file URL")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t(mode === 'create' ? "Creating" : "Updating") : t(mode === 'create' ? "Create" : "Update")}
            </Button>
          </DialogFooter>
        </form>
        
        {/* Media Library Dialog */}
        <MediaLibraryDialog
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectFile={handleMediaSelect}
          userId={userId}
          mediaType={assetType === 'VIDEO' ? 'VIDEO' : assetType === 'IMAGE' ? 'IMAGE' : 'ALL'}
          title={t("SelectFile") || "Select File from Library"}
        />
      </DialogContent>
    </Dialog>
  );
}
