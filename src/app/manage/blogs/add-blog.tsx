"use client";
import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ImageIcon } from "lucide-react";
import {
  CreateBlogBody,
  CreateBlogBodyType,
} from "@/schemaValidations/blog.schema";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBlogMutation } from "@/queries/useBlog";
import { useAccountProfile } from "@/queries/useAccount";
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

export default function AddBlog() {
  const t = useTranslations("ManageBlog");
  const [open, setOpen] = useState(false);
  const [showThumbnailLibrary, setShowThumbnailLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createBlogMutation = useCreateBlogMutation();
  const submitCountRef = useRef(0);
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  const form = useForm<CreateBlogBodyType>({
    resolver: zodResolver(CreateBlogBody),
    defaultValues: {
      title: "",
      content: "",
      thumbnail: null,
      status: "DRAFT",
      tags: [],
      attachments: [],
    },
  });

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

  const onSubmit = async (values: CreateBlogBodyType) => {
    submitCountRef.current += 1;
    if (createBlogMutation.isPending) return;
    try {
      await createBlogMutation.mutateAsync(values);
      toast({ description: t("BlogAdded", { title: values.title }) });
      form.reset();
      setOpen(false);
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
      toast({ title: t("Error"), description: error.message || t("FailedToAddBlog"), variant: "destructive" });
    }
  };

  return (
    <Dialog
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset();
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t("CreateBlog")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("CreateBlog")}</DialogTitle>
          <DialogDescription>{t("AddDes")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-blog-form"
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            onSubmit={form.handleSubmit(onSubmit, () => {
              toast({ title: t("ValidationError"), description: t("PleaseFixFormErrors"), variant: "destructive" });
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
                      {form.watch("tags")?.map((tag: string, idx: number) => (
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
          <Button type="submit" form="add-blog-form" disabled={createBlogMutation.isPending}>
            {createBlogMutation.isPending ? t("Submitting") : t("Add")}
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
