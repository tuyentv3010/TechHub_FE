"use client";
import { useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetBlog, useUpdateBlogMutation } from "@/queries/useBlog";
import { UpdateBlogBody, UpdateBlogBodyType } from "@/schemaValidations/blog.schema";
import dynamic from "next/dynamic";
import TagInput from "@/components/blog/tag-input";

const RichTextEditor = dynamic(() => import("@/components/blog/block-note-editor"), {
  ssr: false,
});

type EditBlogProps = {
  id: string;
  setId: (value: string | undefined) => void;
  onSubmitSuccess?: () => void;
};

export default function EditBlog({ id, setId, onSubmitSuccess }: EditBlogProps) {
  const t = useTranslations("ManageBlog");
  const { data, isLoading } = useGetBlog({ id, enabled: Boolean(id) });
  const updateBlogMutation = useUpdateBlogMutation();

  const form = useForm<UpdateBlogBodyType>({
    resolver: zodResolver(UpdateBlogBody),
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
      tags: [],
      attachments: [],
    },
  });

  useEffect(() => {
    if (data?.payload?.data) {
      const { title, content, status, tags, attachments } = data.payload.data;
      form.reset({ title, content, status, tags: tags || [], attachments: attachments || [] });
    }
  }, [data, form]);

  const reset = () => {
    form.reset();
    setId(undefined);
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
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder={t("TagsPlaceholder")}
                    />
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
    </Dialog>
  );
}
