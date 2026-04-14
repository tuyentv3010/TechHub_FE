"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useGetPermissions } from "@/queries/usePermission";
import {
  useAssignPermissionsToRoleMutation,
  useCreateRoleMutation,
  useGetRole,
  useUpdateRoleMutation,
} from "@/queries/useRole";
import {
  CreateRoleBody,
  CreateRoleBodyType,
  UpdateRoleBodyType,
} from "@/schemaValidations/role.schema";

type RoleModalProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  roleId?: string;
  onSubmitSuccess?: () => void;
};

type PermissionGroup = {
  resource: string;
  permissions: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
};

export default function RoleModal({
  open,
  setOpen,
  roleId,
  onSubmitSuccess,
}: RoleModalProps) {
  const t = useTranslations("ManageRole");
  const isEdit = !!roleId;
  const { data: roleData } = useGetRole(roleId!, isEdit);
  const { data: permissionsData } = useGetPermissions();
  const permissions = permissionsData?.payload?.data ?? [];

  const createRoleMutation = useCreateRoleMutation();
  const updateRoleMutation = useUpdateRoleMutation();
  const assignPermissionsMutation = useAssignPermissionsToRoleMutation();

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  const groupedPermissions: PermissionGroup[] = permissions.reduce(
    (
      acc: PermissionGroup[],
      perm: { id: string; name: string; method: string; url: string; resource: string }
    ) => {
      const existing = acc.find((group) => group.resource === perm.resource);
      if (existing) {
        existing.permissions.push({
          id: perm.id,
          name: perm.name,
          method: perm.method,
          url: perm.url,
        });
      } else {
        acc.push({
          resource: perm.resource,
          permissions: [
            {
              id: perm.id,
              name: perm.name,
              method: perm.method,
              url: perm.url,
            },
          ],
        });
      }
      return acc;
    },
    [] as PermissionGroup[]
  );

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
    form.reset();
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

  const toggleResourceAll = (resource: string) => {
    const group = groupedPermissions.find((item) => item.resource === resource);
    if (!group) return;

    const allSelected = group.permissions.every((permission) =>
      selectedPermissionIds.has(permission.id)
    );
    const nextSelected = new Set(selectedPermissionIds);

    if (allSelected) {
      group.permissions.forEach((permission) => nextSelected.delete(permission.id));
    } else {
      group.permissions.forEach((permission) => nextSelected.add(permission.id));
    }

    setSelectedPermissionIds(nextSelected);
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "text-green-600 font-semibold",
      POST: "text-orange-600 font-semibold",
      PUT: "text-blue-600 font-semibold",
      DELETE: "text-red-600 font-semibold",
      PATCH: "text-purple-600 font-semibold",
    };
    return colors[method] || "";
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && reset()}>
      <DialogContent className="manage-dialog-panel sm:max-w-[800px] max-h-[90vh] flex flex-col rounded-[1.35rem] border-border/50">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("EditRole") : t("AddRole")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("EditRoleDescription") : t("AddRoleDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form
              id="role-form"
              className="grid gap-4 py-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>{t("PermissionsLabel")}</FormLabel>
                  <Badge variant="secondary">
                    {t("SelectedCount", { count: selectedPermissionIds.size })}
                  </Badge>
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                  {groupedPermissions.map((group) => {
                    const allSelected = group.permissions.every((permission) =>
                      selectedPermissionIds.has(permission.id)
                    );

                    return (
                      <div key={group.resource} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={allSelected}
                            onCheckedChange={() => toggleResourceAll(group.resource)}
                          />
                          <span className="font-semibold text-lg">{group.resource}</span>
                        </div>
                        <div className="ml-8 grid grid-cols-1 gap-2">
                          {group.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center gap-2">
                              <Switch
                                checked={selectedPermissionIds.has(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="flex-1">
                                <span className="text-sm">{permission.name}</span>
                                {" - "}
                                <span className={`text-xs ${getMethodColor(permission.method)}`}>
                                  {permission.method}
                                </span>
                                {" "}
                                <code className="text-xs text-muted-foreground">
                                  {permission.url}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button
            type="submit"
            form="role-form"
            className="manage-primary-button"
            disabled={
              createRoleMutation.isPending ||
              updateRoleMutation.isPending ||
              assignPermissionsMutation.isPending
            }
          >
            {isEdit ? t("UpdateRole") : t("AddRole")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
