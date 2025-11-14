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
  DialogTrigger,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Edit, Trash2, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import {
  useGetChapters,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
} from "@/queries/useCourse";
import {
  CreateChapterBodyType,
  CreateChapterBody,
  UpdateChapterBodyType,
  UpdateChapterBody,
  ChapterItemType,
} from "@/schemaValidations/course.schema";
import TableSkeleton from "@/components/Skeleton";

interface ChapterManagementProps {
  courseId: string;
}

export default function ChapterManagement({ courseId }: ChapterManagementProps) {
  const t = useTranslations("ManageCourse");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editChapter, setEditChapter] = useState<ChapterItemType | null>(null);
  const [deleteChapter, setDeleteChapter] = useState<ChapterItemType | null>(null);

  const { data: chaptersData, isLoading } = useGetChapters(courseId);
  const createMutation = useCreateChapterMutation();
  const updateMutation = useUpdateChapterMutation();
  const deleteMutation = useDeleteChapterMutation();

  const chapters = (chaptersData?.payload?.data || []) as ChapterItemType[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("Chapters")}</CardTitle>
            <CardDescription>{t("ManageChaptersDescription")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("AddChapter")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("NoChapters")}
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <div className="flex-1">
                  <h4 className="font-medium">{chapter.title}</h4>
                  {chapter.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chapter.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Order")}: {chapter.order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditChapter(chapter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeleteChapter(chapter)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Chapter Dialog */}
      <AddChapterDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        courseId={courseId}
        createMutation={createMutation}
        nextOrder={chapters.length + 1}
      />

      {/* Edit Chapter Dialog */}
      {editChapter && (
        <EditChapterDialog
          open={Boolean(editChapter)}
          onOpenChange={(open) => !open && setEditChapter(null)}
          courseId={courseId}
          chapter={editChapter}
          updateMutation={updateMutation}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteChapter)}
        onOpenChange={(open) => !open && setDeleteChapter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ConfirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("DeleteChapterWarning", { title: deleteChapter?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteChapter) {
                  try {
                    await deleteMutation.mutateAsync({
                      courseId,
                      chapterId: deleteChapter.id,
                    });
                    toast({
                      title: t("DeleteSuccess"),
                      description: t("ChapterDeleted", { title: deleteChapter.title }),
                    });
                    setDeleteChapter(null);
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
    </Card>
  );
}

// Add Chapter Dialog Component
function AddChapterDialog({
  open,
  onOpenChange,
  courseId,
  createMutation,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  createMutation: any;
  nextOrder: number;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<CreateChapterBodyType>({
    resolver: zodResolver(CreateChapterBody),
    defaultValues: {
      title: "",
      description: "",
      order: nextOrder,
    },
  });

  const onSubmit = async (data: CreateChapterBodyType) => {
    if (createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({ courseId, body: data });
      toast({
        title: t("CreateSuccess"),
        description: t("ChapterCreated", { title: data.title }),
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("AddChapter")}</DialogTitle>
          <DialogDescription>{t("AddChapterDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("ChapterTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("ChapterDescriptionPlaceholder")}
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t("OrderLabel")}</Label>
            <Input
              id="order"
              type="number"
              min={1}
              {...form.register("order", { valueAsNumber: true })}
            />
            {form.formState.errors.order && (
              <p className="text-sm text-destructive">
                {form.formState.errors.order.message}
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

// Edit Chapter Dialog Component
function EditChapterDialog({
  open,
  onOpenChange,
  courseId,
  chapter,
  updateMutation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapter: ChapterItemType;
  updateMutation: any;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<UpdateChapterBodyType>({
    resolver: zodResolver(UpdateChapterBody),
    defaultValues: {
      title: chapter.title,
      description: chapter.description || "",
      order: chapter.order,
    },
  });

  const onSubmit = async (data: UpdateChapterBodyType) => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        courseId,
        chapterId: chapter.id,
        body: data,
      });
      toast({
        title: t("UpdateSuccess"),
        description: t("ChapterUpdated", { title: data.title || chapter.title }),
      });
      onOpenChange(false);
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("EditChapter")}</DialogTitle>
          <DialogDescription>{t("EditChapterDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("ChapterTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("ChapterDescriptionPlaceholder")}
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t("OrderLabel")}</Label>
            <Input
              id="order"
              type="number"
              min={1}
              {...form.register("order", { valueAsNumber: true })}
            />
            {form.formState.errors.order && (
              <p className="text-sm text-destructive">
                {form.formState.errors.order.message}
              </p>
            )}
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
