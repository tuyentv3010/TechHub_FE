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
  FolderOpen
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import fileApiRequest from "@/apiRequests/file";
import {
  useGetCourseById,
  useGetLesson,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
} from "@/queries/useCourse";
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
} from "@/schemaValidations/course.schema";
import TableSkeleton from "@/components/Skeleton";
import { useAccountProfile } from "@/queries/useAccount";

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

  const course = courseData?.payload?.data?.summary;
  const chapters = courseData?.payload?.data?.chapters || [];

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

                                                {/* Assets List */}
                                                {expandedLessons.has(lesson.id) && (
                                                  <div className="px-12 py-3 bg-muted/30 border-t">
                                                    {(!lesson.assets || lesson.assets.length === 0) ? (
                                                      <div className="text-center py-4">
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
      
      setValue('externalUrl', fileUrl);
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
