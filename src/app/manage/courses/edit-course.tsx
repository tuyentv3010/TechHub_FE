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
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, X, ImagePlus, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useGetCourseById, useUpdateCourseMutation } from "@/queries/useCourse";
import {
  UpdateCourseBodyType,
  UpdateCourseBody,
} from "@/schemaValidations/course.schema";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import { useAccountProfile } from "@/queries/useAccount";

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
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  // Media library states
  const [showThumbnailLibrary, setShowThumbnailLibrary] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");

  // Multi-input states
  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");

  const form = useForm<UpdateCourseBodyType>({
    resolver: zodResolver(UpdateCourseBody),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      level: "BEGINNER",
      language: "VI",
      status: "DRAFT",
      categories: [],
      tags: [],
      objectives: [],
      requirements: [],
      thumbnail: "",
      introVideo: "",
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
        categories: course.categories || [],
        tags: course.tags || [],
        objectives: course.objectives || [],
        requirements: course.requirements || [],
        thumbnail: course.thumbnail?.url || "",
        introVideo: course.introVideo?.url || "",
      });
      setThumbnailPreview(course.thumbnail?.url || "");
      setVideoPreview(course.introVideo?.url || "");
    }
  }, [data, form]);

  // Helper functions for array fields
  const addItem = (field: 'categories' | 'tags' | 'objectives' | 'requirements', value: string) => {
    if (!value.trim()) return;
    const current = form.getValues(field) || [];
    if (!current.includes(value.trim())) {
      form.setValue(field, [...current, value.trim()]);
    }
  };

  const removeItem = (field: 'categories' | 'tags' | 'objectives' | 'requirements', index: number) => {
    const current = form.getValues(field) || [];
    form.setValue(field, current.filter((_, i) => i !== index));
  };

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

          {/* Categories */}
          <div className="space-y-2">
            <Label>{t("Categories") || "Categories"}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("CategoryPlaceholder") || "e.g., javascript, programming"}
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('categories', categoryInput);
                    setCategoryInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('categories', categoryInput);
                  setCategoryInput("");
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch("categories")?.map((cat, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {cat}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('categories', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t("Tags") || "Tags"}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("TagPlaceholder") || "e.g., frontend, beginner"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('tags', tagInput);
                    setTagInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('tags', tagInput);
                  setTagInput("");
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch("tags")?.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('tags', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <Label>{t("Objectives") || "Learning Objectives"}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("ObjectivePlaceholder") || "e.g., Understand fundamentals"}
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('objectives', objectiveInput);
                    setObjectiveInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('objectives', objectiveInput);
                  setObjectiveInput("");
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {form.watch("objectives")?.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span>• {obj}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem('objectives', idx)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label>{t("Requirements") || "Requirements"}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("RequirementPlaceholder") || "e.g., Basic HTML knowledge"}
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('requirements', requirementInput);
                    setRequirementInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('requirements', requirementInput);
                  setRequirementInput("");
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {form.watch("requirements")?.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span>• {req}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem('requirements', idx)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>{t("Thumbnail") || "Course Thumbnail"}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowThumbnailLibrary(true)}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {t("SelectThumbnail") || "Select Thumbnail"}
              </Button>
            </div>
            {thumbnailPreview && (
              <div className="relative w-full h-40 border rounded overflow-hidden">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setThumbnailPreview("");
                    form.setValue("thumbnail", "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Intro Video */}
          <div className="space-y-2">
            <Label>{t("IntroVideo") || "Intro Video"}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowVideoLibrary(true)}
              >
                <Video className="w-4 h-4 mr-2" />
                {t("SelectVideo") || "Select Intro Video"}
              </Button>
            </div>
            {videoPreview && (
              <div className="relative w-full h-40 border rounded overflow-hidden bg-muted flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setVideoPreview("");
                    form.setValue("introVideo", "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {videoPreview.split('/').pop()}
                </p>
              </div>
            )}
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

      {/* Media Library Dialogs */}
      {userId && (
        <>
          <MediaLibraryDialog
            open={showThumbnailLibrary}
            onOpenChange={setShowThumbnailLibrary}
            userId={userId}
            mediaType="IMAGE"
            title={t("SelectThumbnail") || "Select Thumbnail"}
            onSelectFile={(file) => {
              form.setValue("thumbnail", file.cloudinarySecureUrl);
              setThumbnailPreview(file.cloudinarySecureUrl);
              setShowThumbnailLibrary(false);
            }}
          />
          <MediaLibraryDialog
            open={showVideoLibrary}
            onOpenChange={setShowVideoLibrary}
            userId={userId}
            mediaType="VIDEO"
            title={t("SelectIntroVideo") || "Select Intro Video"}
            onSelectFile={(file) => {
              form.setValue("introVideo", file.cloudinarySecureUrl);
              setVideoPreview(file.cloudinarySecureUrl);
              setShowVideoLibrary(false);
            }}
          />
        </>
      )}
    </Dialog>
  );
}
