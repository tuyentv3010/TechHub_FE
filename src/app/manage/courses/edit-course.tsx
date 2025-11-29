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
import { PlusCircle, X, ImagePlus, Video, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useGetCourseById, useUpdateCourseMutation } from "@/queries/useCourse";
import { useGetSkills, useGetTags } from "@/queries/useCourse";
import {
  UpdateCourseBodyType,
  UpdateCourseBody,
} from "@/schemaValidations/course.schema";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import { useAccountProfile } from "@/queries/useAccount";
import fileApiRequest from "@/apiRequests/file";
import SkillManager from "@/components/manage/SkillManager";
import TagManager from "@/components/manage/TagManager";
import { CurrencyInputWithSwitch } from "@/components/ui/currency-input-with-switch";

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
  useEffect(() => {
    if (id) {
      console.debug('[FE] EditCourse - requested course id=', id);
    }
  }, [id]);
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  // Media library states
  const [showThumbnailLibrary, setShowThumbnailLibrary] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");

  // Upload states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Multi-input states
  // inputs removed: using backend suggestions and managers instead
  const [objectiveInput, setObjectiveInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [showSkillManager, setShowSkillManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  const { data: skillsData } = useGetSkills();
  const skillsOptions = skillsData?.payload?.data ?? [];
  const { data: tagsData } = useGetTags();
  const tagsOptions = tagsData?.payload?.data ?? [];

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
      skills: [],
      tags: [],
      objectives: [],
      requirements: [],
      thumbnail: "",
      introVideo: "",
    },
  });

  useEffect(() => {
    if (data) {
      console.debug('[FE] EditCourse - getCourseById response', data);
    }
    if (data?.payload?.data?.summary) {
      const course = data.payload.data.summary;
      console.debug('[FE] EditCourse - course summary', course);
      // Backend returns skills array (name strings), map to form
      const skillNames = (course.skills || []).map((s: any) => typeof s === 'string' ? s : s.name);
      const tagNames = (course.tags || []).map((t: any) => typeof t === 'string' ? t : t.name);
      
      form.reset({
        title: course.title,
        description: course.description || "",
        price: course.price,
        discountPrice: course.discountPrice || undefined,
        level: course.level,
        language: course.language,
        status: course.status,
        categories: course.categories || [],
        skills: skillNames,
        tags: tagNames,
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
  const addItem = (field: 'categories' | 'skills' | 'tags' | 'objectives' | 'requirements', value: string) => {
    if (!value.trim()) return;
    const current = form.getValues(field) || [];
    if (!current.includes(value.trim())) {
      form.setValue(field, [...current, value.trim()], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const toggleItem = (field: 'categories' | 'skills' | 'tags' | 'objectives' | 'requirements', value: string) => {
    if (!value.trim()) return;
    const current = form.getValues(field) || [];
    console.debug('[FE] EditCourse - toggleItem', { field, value, current });
    if (current.includes(value.trim())) {
      form.setValue(field, current.filter((v: string) => v !== value.trim()), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      form.setValue(field, [...current, value.trim()], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const removeItem = (field: 'categories' | 'skills' | 'tags' | 'objectives' | 'requirements', index: number) => {
    const current = form.getValues(field) || [];
    form.setValue(field, current.filter((_: any, i: number) => i !== index), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: t("InvalidFileType"), 
        description: t("PleaseSelectImage"), 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: t("FileTooLarge"), 
        description: t("ImageSizeLimit"), 
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('altText', file.name);
      formData.append('caption', 'Course thumbnail');

      const response = await fileApiRequest.uploadFile(formData);
      
      if (response.payload?.data?.cloudinarySecureUrl) {
        form.setValue('thumbnail', response.payload.data.cloudinarySecureUrl);
        setThumbnailPreview(response.payload.data.cloudinarySecureUrl);
        toast({ description: t("ThumbnailUploadSuccess") });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: t("Error"), 
        description: error.message || t("ThumbnailUploadFailed"), 
        variant: "destructive" 
      });
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({ 
        title: t("InvalidFileType"), 
        description: t("PleaseSelectVideo"), 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({ 
        title: t("FileTooLarge"), 
        description: t("VideoSizeLimit"), 
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('altText', file.name);
      formData.append('caption', 'Course intro video');

      const response = await fileApiRequest.uploadFile(formData);
      
      if (response.payload?.data?.cloudinarySecureUrl) {
        form.setValue('introVideo', response.payload.data.cloudinarySecureUrl);
        setVideoPreview(response.payload.data.cloudinarySecureUrl);
        toast({ description: t("VideoUploadSuccess") });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: t("Error"), 
        description: error.message || t("VideoUploadFailed"), 
        variant: "destructive" 
      });
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: UpdateCourseBodyType) => {
    if (updateCourseMutation.isPending || !id) return;
    
    // Prepare payload with skills field (preferred by backend)
    const skills = form.getValues('skills') || [];
    const payload = {
      ...data,
      skills: Array.isArray(skills) ? skills : [],
    };
    
    console.debug('[FE] EditCourse - submit payload', { id, body: payload });
    console.debug('[FE] EditCourse - skills:', payload.skills);
    
    try {
      await updateCourseMutation.mutateAsync({ id, body: payload });
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
              <Label htmlFor="title">{t("TitleLabel")}</Label>
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
              <Label htmlFor="level">{t("LevelLabel")}</Label>
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
            <Label htmlFor="description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("DescriptionPlaceholder")}
              rows={4}
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">{t("PriceLabel")}</Label>
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <CurrencyInputWithSwitch
                    id="price"
                    placeholder="49 000"
                    value={field.value}
                    onChange={(numericValue) => field.onChange(numericValue)}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">{t("DiscountPriceLabel")}</Label>
              <Controller
                name="discountPrice"
                control={form.control}
                render={({ field }) => (
                  <CurrencyInputWithSwitch
                    id="discountPrice"
                    placeholder="29 000"
                    value={field.value}
                    onChange={(numericValue) => field.onChange(numericValue)}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("LanguageLabel")}</Label>
              <Select
                value={form.watch("language")}
                onValueChange={(value: any) => form.setValue("language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VI">{t("Language.VI")}</SelectItem>
                  <SelectItem value="EN">{t("Language.EN")}</SelectItem>
                  <SelectItem value="JA">{t("Language.JA")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>{t("SkillsLabel")}</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSkillManager(true)}
                  className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {t("ManageSkills") || "Manage"}
                </Button>
              </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch("skills")?.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {skill}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('skills', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t("TagsLabel")}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowTagManager(true)}
                className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {t("ManageTags") || "Manage tags"}
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
            <Label>{t("ObjectivesLabel")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("ObjectivePlaceholder")}
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
                  <span>{obj}</span>
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
            <Label>{t("RequirementsLabel")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("RequirementPlaceholder")}
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
                  <span>{req}</span>
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
            <Label>{t("Thumbnail")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowThumbnailLibrary(true)}
                disabled={isUploadingThumbnail}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {t("SelectThumbnail")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => thumbnailFileInputRef.current?.click()}
                disabled={isUploadingThumbnail}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingThumbnail ? t("Uploading") : t("UploadThumbnail")}
              </Button>
              <input
                ref={thumbnailFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
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
            <Label>{t("IntroVideo")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowVideoLibrary(true)}
                disabled={isUploadingVideo}
              >
                <Video className="w-4 h-4 mr-2" />
                {t("SelectVideo")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={isUploadingVideo}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingVideo ? t("Uploading") : t("UploadVideo")}
              </Button>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>
            {videoPreview && (
              <div className="relative w-full h-40 border rounded overflow-hidden bg-black">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-full object-contain"
                  poster={thumbnailPreview || undefined}
                >
                  Your browser does not support the video tag.
                </video>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => {
                    setVideoPreview("");
                    form.setValue("introVideo", "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("StatusLabel")}</Label>
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
      <SkillManager
        open={showSkillManager}
        onOpenChange={setShowSkillManager}
        onSelect={(s) => toggleItem('skills', s.name)}
        selectedItems={form.watch('skills') || []}
      />
      <TagManager
        open={showTagManager}
        onOpenChange={setShowTagManager}
        onSelect={(t) => toggleItem('tags', t.name)}
        selectedItems={form.watch('tags') || []}
      />
    </Dialog>
  );
}


