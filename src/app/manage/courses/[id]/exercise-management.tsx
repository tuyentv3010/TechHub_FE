"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Edit2,
  Trash2,
  GripVertical,
  Code,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  useCreateExercisesMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
} from "@/queries/useCourse";
import {
  CreateExerciseBody,
  CreateExerciseBodyType,
  UpdateExerciseBody,
  UpdateExerciseBodyType,
  ExerciseItemType,
} from "@/schemaValidations/course.schema";
import { handleErrorApi } from "@/lib/utils";

interface ExerciseManagementProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  exercises: ExerciseItemType[];
  onRefresh?: () => void;
}

const ExerciseTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return <CheckCircle className="h-4 w-4" />;
    case "CODING":
      return <Code className="h-4 w-4" />;
    case "OPEN_ENDED":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function ExerciseManagement({
  courseId,
  chapterId,
  lessonId,
  exercises,
  onRefresh,
}: ExerciseManagementProps) {
  const t = useTranslations("ManageCourse");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<ExerciseItemType | null>(null);
  const [deleteExercise, setDeleteExercise] = useState<ExerciseItemType | null>(null);

  const createMutation = useCreateExercisesMutation();
  const updateMutation = useUpdateExerciseMutation();
  const deleteMutation = useDeleteExerciseMutation();

  const handleSuccess = () => {
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t("Exercises")}</h4>
        <Button size="sm" variant="ghost" onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          {t("AddExercise")}
        </Button>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-xs">
          {t("NoExercises")}
        </div>
      ) : (
        <div className="space-y-1.5">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-accent/20 transition-colors"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-move" />
              <ExerciseTypeIcon type={exercise.type} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{exercise.question}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{exercise.type}</span>
                  {exercise.testCases && exercise.testCases.length > 0 && (
                    <span>• {exercise.testCases.length} test cases</span>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditExercise(exercise)}
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteExercise(exercise)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Dialog */}
      <AddExerciseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        courseId={courseId}
        chapterId={chapterId}
        lessonId={lessonId}
        createMutation={createMutation}
        nextOrder={exercises.length + 1}
        onSuccess={handleSuccess}
      />

      {/* Edit Exercise Dialog */}
      {editExercise && (
        <EditExerciseDialog
          open={Boolean(editExercise)}
          onOpenChange={(open) => !open && setEditExercise(null)}
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          exercise={editExercise}
          updateMutation={updateMutation}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteExercise)}
        onOpenChange={(open) => !open && setDeleteExercise(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("DeleteExercise")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("DeleteExerciseConfirm", { question: deleteExercise?.question })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteExercise) return;
                try {
                  await deleteMutation.mutateAsync({
                    courseId,
                    lessonId,
                    exerciseId: deleteExercise.id,
                  });
                  toast({
                    title: t("DeleteSuccess"),
                    description: t("ExerciseDeleted"),
                  });
                  setDeleteExercise(null);
                  handleSuccess();
                } catch (error: any) {
                  handleErrorApi({ error });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("Deleting") : t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add Exercise Dialog Component
function AddExerciseDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  lessonId,
  createMutation,
  nextOrder,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  lessonId: string;
  createMutation: any;
  nextOrder: number;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<CreateExerciseBodyType>({
    resolver: zodResolver(CreateExerciseBody),
    defaultValues: {
      type: "MULTIPLE_CHOICE",
      question: "",
      orderIndex: nextOrder,
      options: null,
      testCases: [],
    },
  });

  const exerciseType = form.watch("type");

  const onSubmit = async (data: CreateExerciseBodyType) => {
    if (createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({
        courseId,
        lessonId,
        body: [data], // API expects array
      });
      toast({
        title: t("CreateSuccess"),
        description: t("ExerciseCreated"),
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("AddExercise")}</DialogTitle>
          <DialogDescription>{t("AddExerciseDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("ExerciseType")}</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MULTIPLE_CHOICE">{t("MultipleChoice")}</SelectItem>
                <SelectItem value="CODING">{t("Coding")}</SelectItem>
                <SelectItem value="OPEN_ENDED">{t("OpenEnded")}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-xs text-destructive">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">{t("Question")}</Label>
            <Textarea
              id="question"
              placeholder={t("QuestionPlaceholder")}
              rows={4}
              {...form.register("question")}
            />
            {form.formState.errors.question && (
              <p className="text-xs text-destructive">
                {form.formState.errors.question.message}
              </p>
            )}
          </div>

          {exerciseType === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <Label htmlFor="options">{t("Options")}</Label>
              <Textarea
                id="options"
                placeholder={t("OptionsPlaceholder")}
                rows={3}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    form.setValue("options", parsed);
                  } catch {
                    form.setValue("options", e.target.value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("OptionsHint")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="orderIndex">{t("Order")}</Label>
            <Input
              id="orderIndex"
              type="number"
              min={1}
              {...form.register("orderIndex", { valueAsNumber: true })}
            />
            {form.formState.errors.orderIndex && (
              <p className="text-xs text-destructive">
                {form.formState.errors.orderIndex.message}
              </p>
            )}
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

// Edit Exercise Dialog Component
function EditExerciseDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  lessonId,
  exercise,
  updateMutation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  lessonId: string;
  exercise: ExerciseItemType;
  updateMutation: any;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<UpdateExerciseBodyType>({
    resolver: zodResolver(UpdateExerciseBody),
    defaultValues: {
      type: exercise.type,
      question: exercise.question,
      orderIndex: exercise.orderIndex,
      options: exercise.options,
      testCases: exercise.testCases || [],
    },
  });

  const exerciseType = form.watch("type");

  const onSubmit = async (data: UpdateExerciseBodyType) => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        courseId,
        lessonId,
        exerciseId: exercise.id,
        body: data,
      });
      toast({
        title: t("UpdateSuccess"),
        description: t("ExerciseUpdated"),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("EditExercise")}</DialogTitle>
          <DialogDescription>{t("EditExerciseDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("ExerciseType")}</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MULTIPLE_CHOICE">{t("MultipleChoice")}</SelectItem>
                <SelectItem value="CODING">{t("Coding")}</SelectItem>
                <SelectItem value="OPEN_ENDED">{t("OpenEnded")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">{t("Question")}</Label>
            <Textarea
              id="question"
              placeholder={t("QuestionPlaceholder")}
              rows={4}
              {...form.register("question")}
            />
            {form.formState.errors.question && (
              <p className="text-xs text-destructive">
                {form.formState.errors.question.message}
              </p>
            )}
          </div>

          {exerciseType === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <Label htmlFor="options">{t("Options")}</Label>
              <Textarea
                id="options"
                placeholder={t("OptionsPlaceholder")}
                rows={3}
                defaultValue={
                  typeof exercise.options === "string"
                    ? exercise.options
                    : JSON.stringify(exercise.options, null, 2)
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    form.setValue("options", parsed);
                  } catch {
                    form.setValue("options", e.target.value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("OptionsHint")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="orderIndex">{t("Order")}</Label>
            <Input
              id="orderIndex"
              type="number"
              min={1}
              {...form.register("orderIndex", { valueAsNumber: true })}
            />
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
