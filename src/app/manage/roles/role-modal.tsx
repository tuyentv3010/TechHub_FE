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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetRole,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignPermissionsToRoleMutation,
} from "@/queries/useRole";
import { useGetPermissions } from "@/queries/usePermission";
import {
  CreateRoleBody,
  CreateRoleBodyType,
  UpdateRoleBodyType,
} from "@/schemaValidations/role.schema";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const isEdit = !!roleId;
  const { data: roleData } = useGetRole(roleId!, isEdit);
  const { data: permissionsData } = useGetPermissions();
  console.log("asdasdas lac da  , " ,roleData)  
  const permissions = permissionsData?.payload?.data ?? [];

  const createRoleMutation = useCreateRoleMutation();
  const updateRoleMutation = useUpdateRoleMutation();
  const assignPermissionsMutation = useAssignPermissionsToRoleMutation();

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  // Group permissions by resource
  const groupedPermissions: PermissionGroup[] = permissions.reduce((acc, perm) => {
    const existing = acc.find((g) => g.resource === perm.resource);
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
  }, [] as PermissionGroup[]);

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
      const role = roleData?.payload?.data;
      form.reset({
        name: role.name,
        description: role.description || "",
        active: role.isActive,
      });
      setSelectedPermissionIds(new Set(role.permissionIds || []));
    } else {
      form.reset({
        name: "",
        description: "",
        active: true,
      });
      setSelectedPermissionIds(new Set());
    }
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
        };
        await updateRoleMutation.mutateAsync({ id: roleId!, body });
        
        // Update permissions
        await assignPermissionsMutation.mutateAsync({
          roleId: roleId!,
          body: { permissionIds: Array.from(selectedPermissionIds) },
        });
        
        toast({ description: "Role đã được cập nhật" });
      } else {
        const result = await createRoleMutation.mutateAsync(values);
        
        // Assign permissions to new role
        if (result.data && selectedPermissionIds.size > 0) {
          await assignPermissionsMutation.mutateAsync({
            roleId: result.data.id,
            body: { permissionIds: Array.from(selectedPermissionIds) },
          });
        }
        
        toast({ description: "Role đã được tạo" });
      }
      reset();
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({
        title: "Lỗi",
        description: isEdit ? "Không thể cập nhật role" : "Không thể tạo role",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissionIds);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissionIds(newSet);
  };

  const toggleResourceAll = (resource: string) => {
    const group = groupedPermissions.find((g) => g.resource === resource);
    if (!group) return;

    const allSelected = group.permissions.every((p) => selectedPermissionIds.has(p.id));
    const newSet = new Set(selectedPermissionIds);

    if (allSelected) {
      group.permissions.forEach((p) => newSet.delete(p.id));
    } else {
      group.permissions.forEach((p) => newSet.add(p.id));
    }
    setSelectedPermissionIds(newSet);
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa Role" : "Thêm Role Mới"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin role" : "Tạo role mới và gán permissions"}
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
                      Tên <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ADMIN" {...field} />
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
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Quản trị viên hệ thống" {...field} />
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
                    <FormLabel>Trạng thái</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <span className="text-sm">{field.value ? "Active" : "Inactive"}</span>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Permissions Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Permissions</FormLabel>
                  <Badge variant="secondary">
                    {selectedPermissionIds.size} đã chọn
                  </Badge>
                </div>
                <div className="space-y-4 border rounded-lg p-4">
                  {groupedPermissions.map((group) => {
                    const allSelected = group.permissions.every((p) =>
                      selectedPermissionIds.has(p.id)
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
                          {group.permissions.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Switch
                                checked={selectedPermissionIds.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <div className="flex-1">
                                <span className="text-sm">{perm.name}</span>
                                {" - "}
                                <span className={`text-xs ${getMethodColor(perm.method)}`}>
                                  {perm.method}
                                </span>
                                {" "}
                                <code className="text-xs text-muted-foreground">
                                  {perm.url}
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
            disabled={
              createRoleMutation.isPending ||
              updateRoleMutation.isPending ||
              assignPermissionsMutation.isPending
            }
          >
            {isEdit ? "Cập nhật Role" : "Thêm Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
