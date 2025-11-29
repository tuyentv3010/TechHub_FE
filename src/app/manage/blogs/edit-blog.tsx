"use client";
import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetBlog, useUpdateBlogMutation } from "@/queries/useBlog";
import { useAccountProfile } from "@/queries/useAccount";
import { UpdateBlogBody, UpdateBlogBodyType } from "@/schemaValidations/blog.schema";
import dynamic from "next/dynamic";
import { useGetTags } from "@/queries/useCourse";
import TagManager from "@/components/manage/TagManager";
import { Badge } from "@/components/ui/badge";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import fileApiRequest from "@/apiRequests/file";
import { Upload } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/blog/rich-text-editor"), {
  ssr: false,
});

type EditBlogProps = {
  id: string;
  setId: (value: string | undefined) => void;
  onSubmitSuccess?: () => void;
};

export default function EditBlog({ id, setId, onSubmitSuccess }: EditBlogProps) {
  const t = useTranslations("ManageBlog");
  const [showThumbnailLibrary, setShowThumbnailLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useGetBlog({ id, enabled: Boolean(id) });
  const updateBlogMutation = useUpdateBlogMutation();
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  const form = useForm<UpdateBlogBodyType>({
    resolver: zodResolver(UpdateBlogBody),
    defaultValues: {
      title: "",
      content: "",
      thumbnail: null,
      status: "DRAFT",
      tags: [],
      attachments: [],
    },
  });

  useEffect(() => {
    if (data?.payload?.data) {
      const { title, content, thumbnail, status, tags, attachments } = data.payload.data;
      form.reset({ 
        title, 
        content, 
        thumbnail: thumbnail || null,
        status, 
        tags: tags || [], 
        attachments: attachments || [] 
      });
    }
  }, [data, form]);

  const { data: tagsData } = useGetTags();
  const tagsOptions = tagsData?.payload?.data ?? [];
  const [showTagManager, setShowTagManager] = useState(false);

  const toggleTag = (tagName: string) => {
    const current = form.getValues('tags') || [];
    if (current.includes(tagName)) {
      form.setValue('tags', current.filter((t: string) => t !== tagName), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      form.setValue('tags', [...current, tagName], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const reset = () => {
    form.reset();
    setId(undefined);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: t("Error"), 
        description: "Please select an image file", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: t("Error"), 
        description: "File size must be less than 10MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('altText', file.name);
      formData.append('caption', 'Blog thumbnail');

      const response = await fileApiRequest.uploadFile(formData);
      
      if (response.payload?.data?.cloudinarySecureUrl) {
        form.setValue('thumbnail', response.payload.data.cloudinarySecureUrl);
        toast({ description: "Thumbnail uploaded successfully" });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: t("Error"), 
        description: error.message || "Failed to upload thumbnail", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (values: UpdateBlogBodyType) => {
    if (updateBlogMutation.isPending) return;
    try {
      await updateBlogMutation.mutateAsync({ id, body: values });
      toast({ description: t("BlogUpdated", { title: values.title }) });
      reset();
      onSubmitSuccess?.();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({ description: t("UpdateFailed"), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">{t("Loading")}</span>
      </div>
    );
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) reset();
      }}
    >
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto" onCloseAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle>{t("UpdateBlog")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-blog-form"
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            onSubmit={form.handleSubmit(onSubmit, () => {
              toast({ description: t("ValidationFailed"), variant: "destructive" });
            })}
          >
            <div className="grid gap-6 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("TitleLabel")}</FormLabel>
                    <Input placeholder={t("TitlePlaceholder")} {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Thumbnail")}</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter thumbnail URL or choose from library" 
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowThumbnailLibrary(true)}
                        disabled={isUploading}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    {field.value && (
                      <div className="mt-2 relative w-full h-40 border rounded-md overflow-hidden">
                        <img 
                          src={field.value} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("Status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Tags")}</FormLabel>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" onClick={() => setShowTagManager(true)} className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700">
                        {t("ManageTags") || "Manage tags"}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("tags")?.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Content")}</FormLabel>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("ContentPlaceholder")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="edit-blog-form" disabled={updateBlogMutation.isPending}>
            {updateBlogMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Submitting")}
              </>
            ) : (
              t("UpdateBlog")
          )}
        </Button>
      </DialogFooter>
    </DialogContent>

    {/* Thumbnail Library Dialog */}
    <MediaLibraryDialog
      open={showThumbnailLibrary}
      onOpenChange={setShowThumbnailLibrary}
      onSelectFile={(file) => {
        form.setValue('thumbnail', file.cloudinarySecureUrl);
        setShowThumbnailLibrary(false);
      }}
      userId={userId}
      mediaType="IMAGE"
      title="Select Thumbnail"
    />

    <TagManager
      open={showTagManager}
      onOpenChange={setShowTagManager}
      onSelect={(t: any) => toggleTag(t.name)}
      selectedItems={form.watch('tags') || []}
    />
  </Dialog>
  );
}