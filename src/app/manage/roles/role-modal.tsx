"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  getAccessCopy,
  getResourceMeta,
  groupPermissionsByResource,
  METHOD_BADGE_TONE,
} from "@/lib/access-control";
import { handleErrorApi } from "@/lib/utils";
import { useGetPermissions } from "@/queries/usePermission";
import {
  useCreateRoleMutation,
  useGetRole,
  useUpdateRoleMutation,
} from "@/queries/useRole";
import {
  CreateRoleBody,
  CreateRoleBodyType,
  UpdateRoleBodyType,
} from "@/schemaValidations/role.schema";
import type { PermissionSchemaType } from "@/schemaValidations/permission.schema";

type RoleModalProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  roleId?: string;
  onSubmitSuccess?: () => void;
};

export default function RoleModal({
  open,
  setOpen,
  roleId,
  onSubmitSuccess,
}: RoleModalProps) {
  const t = useTranslations("ManageRole");
  const locale = useLocale();
  const accessCopy = getAccessCopy(locale);
  const isEdit = !!roleId;
  const { data: roleData } = useGetRole(roleId!, isEdit);
  const { data: permissionsData } = useGetPermissions();
  const permissions: PermissionSchemaType[] = permissionsData?.payload?.data ?? [];
  const groupedPermissions = groupPermissionsByResource(permissions);

  const createRoleMutation = useCreateRoleMutation();
  const updateRoleMutation = useUpdateRoleMutation();

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  const form = useForm<CreateRoleBodyType>({
    resolver: zodResolver(CreateRoleBody),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  useEffect(() => {
    if (isEdit && roleData?.payload?.data) {
      const role = roleData.payload.data;
      form.reset({
        name: role.name,
        description: role.description || "",
        active: role.isActive,
      });
      setSelectedPermissionIds(new Set(role.permissionIds || []));
      return;
    }

    form.reset({
      name: "",
      description: "",
      active: true,
    });
    setSelectedPermissionIds(new Set());
  }, [roleData, isEdit, form]);

  const reset = () => {
    form.reset({
      name: "",
      description: "",
      active: true,
    });
    setSelectedPermissionIds(new Set());
    setOpen(false);
  };

  const onSubmit = async (values: CreateRoleBodyType) => {
    try {
      if (isEdit) {
        const body: UpdateRoleBodyType = {
          name: values.name,
          description: values.description,
          active: values.active,
          permissionIds: Array.from(selectedPermissionIds),
        };
        await updateRoleMutation.mutateAsync({ id: roleId!, body });
        toast({ description: t("RoleUpdated") });
      } else {
        const body: CreateRoleBodyType = {
          name: values.name,
          description: values.description,
          active: values.active,
          permissionIds: Array.from(selectedPermissionIds),
        };
        await createRoleMutation.mutateAsync(body);
        toast({ description: t("RoleCreated") });
      }

      reset();
      onSubmitSuccess?.();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({
        title: t("ErrorLabel"),
        description: isEdit ? t("UpdateFailed") : t("CreateFailed"),
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    const nextSelected = new Set(selectedPermissionIds);
    if (nextSelected.has(permissionId)) {
      nextSelected.delete(permissionId);
    } else {
      nextSelected.add(permissionId);
    }
    setSelectedPermissionIds(nextSelected);
  };

  const toggleResourceAll = (permissionIds: string[]) => {
    const allSelected = permissionIds.every((permissionId) =>
      selectedPermissionIds.has(permissionId)
    );
    const nextSelected = new Set(selectedPermissionIds);

    if (allSelected) {
      permissionIds.forEach((permissionId) => nextSelected.delete(permissionId));
    } else {
      permissionIds.forEach((permissionId) => nextSelected.add(permissionId));
    }

    setSelectedPermissionIds(nextSelected);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && reset()}>
      <DialogContent className="manage-dialog-panel flex max-h-[90vh] min-h-0 flex-col overflow-hidden rounded-[1.35rem] border-border/50 sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("EditRole") : t("AddRole")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("EditRoleDescription") : t("AddRoleDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <Form {...form}>
            <form
              id="role-form"
              className="grid gap-4 py-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="manage-glass h-auto rounded-2xl border border-border/50 p-1">
                  <TabsTrigger value="overview">{accessCopy.tabs.overview}</TabsTrigger>
                  <TabsTrigger value="permissions">{accessCopy.tabs.permissions}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("NameLabel")} <span className="text-red-500">*</span>
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

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-4">
                        <div className="space-y-1">
                          <FormLabel>{t("StatusLabel")}</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value ? t("Active") : t("Inactive")}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="manage-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base">{accessCopy.roleView.title}</CardTitle>
                      <CardDescription>{accessCopy.roleView.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {accessCopy.roleView.permissionsLabel}
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                          {selectedPermissionIds.size}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {accessCopy.roleView.resourcesLabel}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {Array.from(
                            new Set(
                              permissions
                                .filter((permission) => selectedPermissionIds.has(permission.id))
                                .map((permission) => getResourceMeta(permission.resource, locale).label)
                            )
                          ).join(", ") || accessCopy.shared.emptyResources}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("PermissionsLabel")}</FormLabel>
                    <Badge variant="secondary">
                      {t("SelectedCount", { count: selectedPermissionIds.size })}
                    </Badge>
                  </div>

                  <Card className="manage-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base">{accessCopy.permissionView.title}</CardTitle>
                      <CardDescription>{accessCopy.shared.technicalHint}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {groupedPermissions.map((group) => {
                        const resourceMeta = getResourceMeta(group.resource, locale);
                        const permissionIds = group.permissions.map((permission) => permission.id);
                        const allSelected = permissionIds.every((permissionId) =>
                          selectedPermissionIds.has(permissionId)
                        );

                        return (
                          <div
                            key={group.resource}
                            className="rounded-2xl border border-border/50 bg-background/60 p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="text-base font-semibold">{resourceMeta.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {resourceMeta.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{group.permissions.length}</Badge>
                                <Switch
                                  checked={allSelected}
                                  onCheckedChange={() => toggleResourceAll(permissionIds)}
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                              {group.permissions.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="rounded-2xl border border-border/50 bg-card/70 p-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <Switch
                                      checked={selectedPermissionIds.has(permission.id)}
                                      onCheckedChange={() => togglePermission(permission.id)}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium">{permission.name}</span>
                                        <Badge
                                          variant="secondary"
                                          className={METHOD_BADGE_TONE[permission.method]}
                                        >
                                          {accessCopy.methodLabels[permission.method]}
                                        </Badge>
                                      </div>
                                      <div className="mt-1 text-sm text-muted-foreground">
                                        {permission.description || resourceMeta.description}
                                      </div>
                                      <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                        {permission.url}
                                      </code>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
        <DialogFooter className="flex-shrink-0 border-t border-border/50 pt-4">
          <Button
            type="submit"
            form="role-form"
            className="manage-primary-button"
            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            {isEdit ? t("UpdateRole") : t("AddRole")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
