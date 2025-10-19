"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  UpdateEmployeeAccountBody,
  UpdateEmployeeAccountBodyType,
} from "@/schemaValidations/account.schema";
import { useGetAccount, useUpdateAccountMutation } from "@/queries/useAccount";

type EditEmployeeProps = {
  id: string; // UUID
  setId: (value: string | undefined) => void;
  onSubmitSuccess?: () => void;
};

export default function EditEmployee({
  id,
  setId,
  onSubmitSuccess,
}: EditEmployeeProps) {
  const t = useTranslations("ManageAccount");
  const [file, setFile] = useState<File | undefined>(undefined);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  const { data, isLoading } = useGetAccount({
    id,
    enabled: Boolean(id),
  });
  const updateAccountMutation = useUpdateAccountMutation();

  const form = useForm<UpdateEmployeeAccountBodyType>({
    resolver: zodResolver(UpdateEmployeeAccountBody),
    defaultValues: {
      username: "",
      email: "",
      avatar: undefined,
      phoneNumber: "",
      citizenId: "",
      roles: [],
      changePassword: false,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (data?.payload?.data) {
      const { username, email, avatar, phoneNumber, citizenId, roles } =
        data.payload.data;
      
      form.reset({
        username: username || "",
        email: email || "",
        avatar: avatar ?? undefined,
        phoneNumber: phoneNumber ?? "",
        citizenId: citizenId ?? "",
        roles: roles || [],
        changePassword: false,
        password: "",
        confirmPassword: "",
      });
      setSelectedRoleName(roles?.[0] ?? "");
    }
  }, [data, form]);

  const avatar = form.watch("avatar");
  const username = form.watch("username");
  const changePassword = form.watch("changePassword");

  const previewAvatarFromFile = useMemo(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return url;
    }
    return avatar;
  }, [file, avatar]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const reset = () => {
    form.reset();
    setFile(undefined);
    setSelectedRoleName("");
    setId(undefined);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(undefined);
    }
  };

  const onSubmit = async (values: UpdateEmployeeAccountBodyType) => {
    console.log("Form submitted", values);
    if (updateAccountMutation.isPending) {
      console.log("Mutation skipped: isPending is true");
      return;
    }
    try {
      const result = await updateAccountMutation.mutateAsync({
        id,
        body: values,
        avatarFile: file,
      });
      toast({
        description: t("AccountUpdated", { email: values.email }),
      });
      reset();
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error("Update error:", error);
      handleErrorApi({
        error,
        setError: form.setError,
      });
      toast({
        description: t("UpdateFailed"),
        variant: "destructive",
      });
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
        if (!value) {
          reset();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] max-h-screen overflow-auto"
        onCloseAutoFocus={reset}
      >
        <DialogHeader>
          <DialogTitle>{t("UpdateAccount")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="edit-employee-form"
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form validation errors:", errors);
              toast({
                description: t("ValidationFailed"),
                variant: "destructive",
              });
            })}
          >
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-2 items-start justify-start">
                      <Avatar className="aspect-square w-[100px] h-[100px] rounded-md object-cover">
                        <AvatarImage src={previewAvatarFromFile} />
                        <AvatarFallback className="rounded-none">
                          {username || t("AvatarFallback")}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        ref={avatarInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                description: t("FileTooLarge"),
                                variant: "destructive",
                              });
                              return;
                            }
                            if (
                              !["image/png", "image/jpeg"].includes(file.type)
                            ) {
                              toast({
                                description: t("InvalidFileType"),
                                variant: "destructive",
                              });
                              return;
                            }
                            setFile(file);
                            field.onChange(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        className="flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed"
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">{t("UploadAvatar")}</span>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="username">{t("Name")}</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="username"
                          placeholder={t("NamePlaceholder")}
                          className="w-full"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="email">{t("Email")}</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="email"
                          placeholder={t("EmailPlaceholder")}
                          className="w-full opacity-50"
                          {...field}
                          readOnly
                          value={field.value ?? ""}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="phoneNumber">{t("PhoneNumber")}</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="phoneNumber"
                          placeholder={t("PhoneNumberPlaceholder")}
                          className="w-full"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="citizenId"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="citizenId">{t("CitizenId")}</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="citizenId"
                          placeholder={t("CitizenIdPlaceholder")}
                          className="w-full"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="roles">{t("Role")}</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <select
                          id="roles"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value?.[0] || "LEARNER"}
                          onChange={(e) => field.onChange([e.target.value])}
                        >
                          <option value="LEARNER">Learner</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="changePassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="changePassword">
                        {t("ChangePassword")}
                      </Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              {changePassword && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="password">{t("Password")}</Label>
                        <div className="col-span-3 w-full space-y-2">
                          <Input
                            id="password"
                            type="password"
                            placeholder={t("PasswordPlaceholder")}
                            className="w-full"
                            {...field}
                            value={field.value ?? ""}
                          />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              {changePassword && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="confirmPassword">
                          {t("ConfirmPassword")}
                        </Label>
                        <div className="col-span-3 w-full space-y-2">
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder={t("ConfirmPasswordPlaceholder")}
                            className="w-full"
                            {...field}
                            value={field.value ?? ""}
                          />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            form="edit-employee-form"
            disabled={updateAccountMutation.isPending}
          >
            {updateAccountMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Submitting")}
              </>
            ) : (
              t("UpdateAccount")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
