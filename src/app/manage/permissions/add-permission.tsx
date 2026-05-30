"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useCreatePermissionMutation } from "@/queries/usePermission";
import {
  CreatePermissionBody,
  CreatePermissionBodyType,
  HTTP_METHODS,
  RESOURCES,
} from "@/schemaValidations/permission.schema";

export default function AddPermission({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const t = useTranslations("ManagePermission");
  const createPermissionMutation = useCreatePermissionMutation();

  const form = useForm<CreatePermissionBodyType>({
    resolver: zodResolver(CreatePermissionBody),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      method: "GET",
      resource: "USERS",
      active: true,
    },
  });

  const reset = () => {
    form.reset();
    setOpen(false);
  };

  const onSubmit = async (values: CreatePermissionBodyType) => {
    try {
      await createPermissionMutation.mutateAsync(values);
      toast({ description: t("PermissionCreated") });
      reset();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({
        title: t("ErrorLabel"),
        description: t("CreateFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && reset()}>
      <DialogContent className="manage-dialog-panel sm:max-w-[600px] rounded-[1.35rem] border-border/50">
        <DialogHeader>
          <DialogTitle>{t("AddPermission")}</DialogTitle>
          <DialogDescription>{t("AddPermissionDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-permission-form"
            className="grid gap-4 py-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("NameLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("NamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("DescriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("DescriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("MethodLabel")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("MethodPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HTTP_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("ResourceLabel")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("ResourcePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESOURCES.map((resource) => (
                          <SelectItem key={resource} value={resource}>
                            {resource}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("UrlLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("UrlPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>{t("StatusLabel")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <span className="text-sm">{field.value ? t("Active") : t("Inactive")}</span>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            form="add-permission-form"
            className="manage-primary-button"
            disabled={createPermissionMutation.isPending}
          >
            {t("AddPermission")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
