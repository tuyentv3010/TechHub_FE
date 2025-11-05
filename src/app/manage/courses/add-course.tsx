"use client";

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
import { PlusCircle, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useCreateCourseMutation } from "@/queries/useCourse";
import {
  CreateCourseBodyType,
  CreateCourseBody,
} from "@/schemaValidations/course.schema";

export default function AddCourse({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("ManageCourse");
  const [open, setOpen] = useState(false);
  const createCourseMutation = useCreateCourseMutation();

  const form = useForm<CreateCourseBodyType>({
    resolver: zodResolver(CreateCourseBody),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      level: "BEGINNER",
      language: "VI",
      status: "DRAFT",
      categories: [],
      tags: [],
      objectives: [],
      requirements: [],
    },
  });

  const onSubmit = async (data: CreateCourseBodyType) => {
    if (createCourseMutation.isPending) return;
    try {
      await createCourseMutation.mutateAsync(data);
      toast({
        title: t("CreateSuccess"),
        description: t("CourseCreated"),
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t("AddCourse")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("AddCourse")}</DialogTitle>
          <DialogDescription>{t("AddCourseDescription")}</DialogDescription>
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
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">{t("Price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="49.99"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">{t("DiscountPrice")}</Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                placeholder="29.99"
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
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending ? t("Creating") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
