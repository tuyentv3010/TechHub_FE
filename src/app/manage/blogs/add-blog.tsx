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
import { PlusCircle } from "lucide-react";
import {
  CreateBlogBody,
  CreateBlogBodyType,
} from "@/schemaValidations/blog.schema";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBlogMutation } from "@/queries/useBlog";
import dynamic from "next/dynamic";
import TagInput from "@/components/blog/tag-input";

const RichTextEditor = dynamic(() => import("@/components/blog/rich-text-editor"), {
  ssr: false,
});

export default function AddBlog() {
  const t = useTranslations("ManageBlog");
  const [open, setOpen] = useState(false);
  const createBlogMutation = useCreateBlogMutation();
  const submitCountRef = useRef(0);

  const form = useForm<CreateBlogBodyType>({
    resolver: zodResolver(CreateBlogBody),
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
      tags: [],
      attachments: [],
    },
  });

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
          <Button type="submit" form="add-blog-form" disabled={createBlogMutation.isPending}>
            {createBlogMutation.isPending ? t("Submitting") : t("Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
