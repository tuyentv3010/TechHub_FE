"use client";

import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useGetCourseById, useUpdateCourseMutation } from "@/queries/useCourse";
import {
  UpdateCourseBodyType,
  UpdateCourseBody,
} from "@/schemaValidations/course.schema";

export default function EditCourse({
  id,
  setId,
  onSuccess,
}: {
  id?: string;
  setId: (value: string | undefined) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");
  const updateCourseMutation = useUpdateCourseMutation();
  const { data, refetch } = useGetCourseById(id!);

  const form = useForm<UpdateCourseBodyType>({
    resolver: zodResolver(UpdateCourseBody),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      level: "BEGINNER",
      language: "VI",
      status: "DRAFT",
    },
  });

  useEffect(() => {
    if (data?.payload?.data?.summary) {
      const course = data.payload.data.summary;
      form.reset({
        title: course.title,
        description: course.description || "",
        price: course.price,
        discountPrice: course.discountPrice || undefined,
        level: course.level,
        language: course.language,
        status: course.status,
        categories: course.categories,
        tags: course.tags,
        objectives: course.objectives,
        requirements: course.requirements,
      });
    }
  }, [data, form]);

  const onSubmit = async (data: UpdateCourseBodyType) => {
    if (updateCourseMutation.isPending || !id) return;
    try {
      await updateCourseMutation.mutateAsync({ id, body: data });
      toast({
        title: t("UpdateSuccess"),
        description: t("CourseUpdated"),
      });
      setId(undefined);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => !value && setId(undefined)}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("EditCourse")}</DialogTitle>
          <DialogDescription>{t("EditCourseDescription")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">{t("Title")}</Label>
              <Input
                id="title"
                placeholder={t("TitlePlaceholder")}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">{t("Level")}</Label>
              <Select
                value={form.watch("level")}
                onValueChange={(value: any) => form.setValue("level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">{t("Level.BEGINNER")}</SelectItem>
                  <SelectItem value="INTERMEDIATE">{t("Level.INTERMEDIATE")}</SelectItem>
                  <SelectItem value="ADVANCED">{t("Level.ADVANCED")}</SelectItem>
                  <SelectItem value="ALL_LEVELS">{t("Level.ALL_LEVELS")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("Description")}</Label>
            <Textarea
              id="description"
              placeholder={t("DescriptionPlaceholder")}
              rows={4}
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">{t("Price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register("price", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">{t("DiscountPrice")}</Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                {...form.register("discountPrice", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("Language")}</Label>
              <Select
                value={form.watch("language")}
                onValueChange={(value: any) => form.setValue("language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VI">Tiếng Việt</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="JA">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("Status")}</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value: any) => form.setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">{t("Status.DRAFT")}</SelectItem>
                <SelectItem value="PUBLISHED">{t("Status.PUBLISHED")}</SelectItem>
                <SelectItem value="ARCHIVED">{t("Status.ARCHIVED")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setId(undefined)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={updateCourseMutation.isPending}>
              {updateCourseMutation.isPending ? t("Updating") : t("Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
