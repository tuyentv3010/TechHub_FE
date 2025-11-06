"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Edit, Trash2, GripVertical, Video, FileText, HelpCircle, Code } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} from "@/queries/useCourse";
import {
  CreateLessonBodyType,
  CreateLessonBody,
  UpdateLessonBodyType,
  UpdateLessonBody,
  LessonItemType,
} from "@/schemaValidations/course.schema";

interface LessonManagementProps {
  courseId: string;
  chapterId: string;
  lessons: LessonItemType[];
  onRefresh?: () => void;
}

const ContentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "VIDEO":
      return <Video className="h-4 w-4" />;
    case "TEXT":
      return <FileText className="h-4 w-4" />;
    case "QUIZ":
      return <HelpCircle className="h-4 w-4" />;
    case "CODING":
      return <Code className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function LessonManagement({
  courseId,
  chapterId,
  lessons,
  onRefresh,
}: LessonManagementProps) {
  const t = useTranslations("ManageCourse");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<LessonItemType | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<LessonItemType | null>(null);

  const createMutation = useCreateLessonMutation();
  const updateMutation = useUpdateLessonMutation();
  const deleteMutation = useDeleteLessonMutation();

  const handleSuccess = () => {
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("Lessons")}</h3>
        <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t("AddLesson")}
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          {t("NoLessons")}
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent/30 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <ContentTypeIcon type={lesson.contentType} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-sm truncate">{lesson.title}</h5>
                  {lesson.isFree && (
                    <Badge variant="secondary" className="text-xs">
                      {t("Free")}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {t(`ContentType.${lesson.contentType}`)}
                  </Badge>
                </div>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {lesson.description}
                  </p>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  <span>{t("Order")}: {lesson.orderIndex}</span>
                  {lesson.estimatedDuration && (
                    <span>{t("Duration")}: {Math.floor(lesson.estimatedDuration / 60)}m</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditLesson(lesson)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => setDeleteLesson(lesson)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lesson Dialog */}
      <AddLessonDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        courseId={courseId}
        chapterId={chapterId}
        createMutation={createMutation}
        nextOrder={lessons.length + 1}
        onSuccess={handleSuccess}
      />

      {/* Edit Lesson Dialog */}
      {editLesson && (
        <EditLessonDialog
          open={Boolean(editLesson)}
          onOpenChange={(open) => !open && setEditLesson(null)}
          courseId={courseId}
          chapterId={chapterId}
          lesson={editLesson}
          updateMutation={updateMutation}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteLesson)}
        onOpenChange={(open) => !open && setDeleteLesson(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ConfirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("DeleteLessonWarning", { title: deleteLesson?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteLesson) {
                  try {
                    await deleteMutation.mutateAsync({
                      courseId,
                      chapterId,
                      lessonId: deleteLesson.id,
                    });
                    toast({
                      title: t("DeleteSuccess"),
                      description: t("LessonDeleted", { title: deleteLesson.title }),
                    });
                    setDeleteLesson(null);
                    handleSuccess();
                  } catch (error) {
                    handleErrorApi({ error });
                  }
                }
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add Lesson Dialog Component
function AddLessonDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  createMutation,
  nextOrder,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  createMutation: any;
  nextOrder: number;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<CreateLessonBodyType>({
    resolver: zodResolver(CreateLessonBody),
    defaultValues: {
      title: "",
      description: "",
      contentType: "VIDEO",
      content: "",
      duration: 0,
      orderIndex: nextOrder,
      isFree: false,
    },
  });

  const onSubmit = async (data: CreateLessonBodyType) => {
    if (createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({ courseId, chapterId, body: data });
      toast({
        title: t("CreateSuccess"),
        description: t("LessonCreated", { title: data.title }),
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("AddLesson")}</DialogTitle>
          <DialogDescription>{t("AddLessonDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("LessonTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">{t("ContentTypeLabel")}</Label>
              <Select
                value={form.watch("contentType")}
                onValueChange={(value: any) => form.setValue("contentType", value)}
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
                min={0}
                placeholder="600"
                {...form.register("duration", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("LessonDescriptionPlaceholder")}
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("ContentLabel")}</Label>
            <Textarea
              id="content"
              placeholder={t("ContentPlaceholder")}
              rows={4}
              {...form.register("content")}
            />
            <p className="text-xs text-muted-foreground">
              {t("ContentHint")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderIndex">{t("OrderLabel")}</Label>
              <Input
                id="orderIndex"
                type="number"
                min={1}
                {...form.register("orderIndex", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="isFree"
                checked={form.watch("isFree")}
                onCheckedChange={(checked) => form.setValue("isFree", checked)}
              />
              <Label htmlFor="isFree">{t("IsFreeLesson")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("Creating") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Lesson Dialog Component
function EditLessonDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  lesson,
  updateMutation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  lesson: LessonItemType;
  updateMutation: any;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<UpdateLessonBodyType>({
    resolver: zodResolver(UpdateLessonBody),
    defaultValues: {
      title: lesson.title,
      description: lesson.description || "",
      contentType: lesson.contentType,
      content: lesson.content || "",
      duration: lesson.estimatedDuration || 0,
      orderIndex: lesson.orderIndex,
      isFree: lesson.isFree,
    },
  });

  const onSubmit = async (data: UpdateLessonBodyType) => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        courseId,
        chapterId,
        lessonId: lesson.id,
        body: data,
      });
      toast({
        title: t("UpdateSuccess"),
        description: t("LessonUpdated", { title: data.title || lesson.title }),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("EditLesson")}</DialogTitle>
          <DialogDescription>{t("EditLessonDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("LessonTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">{t("ContentTypeLabel")}</Label>
              <Select
                value={form.watch("contentType")}
                onValueChange={(value: any) => form.setValue("contentType", value)}
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
                min={0}
                {...form.register("duration", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("LessonDescriptionPlaceholder")}
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("ContentLabel")}</Label>
            <Textarea
              id="content"
              placeholder={t("ContentPlaceholder")}
              rows={4}
              {...form.register("content")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderIndex">{t("OrderLabel")}</Label>
              <Input
                id="orderIndex"
                type="number"
                min={1}
                {...form.register("orderIndex", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="isFree"
                checked={form.watch("isFree")}
                onCheckedChange={(checked) => form.setValue("isFree", checked)}
              />
              <Label htmlFor="isFree">{t("IsFreeLesson")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("Updating") : t("Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
