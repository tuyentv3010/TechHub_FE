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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdatePermissionMutation, useGetPermissionById } from "@/queries/usePermission";
import {
  UpdatePermissionBody,
  UpdatePermissionBodyType,
  HTTP_METHODS,
  RESOURCES,
} from "@/schemaValidations/permission.schema";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import { useEffect } from "react";

export default function EditPermission({
  id,
  setId,
  onSubmitSuccess,
}: {
  id: string;
  setId: (value: string | undefined) => void;
  onSubmitSuccess?: () => void;
}) {
  const updatePermissionMutation = useUpdatePermissionMutation();
  const { data, isLoading } = useGetPermissionById(id);
  const permission = data?.payload?.data;

  const form = useForm<UpdatePermissionBodyType>({
    resolver: zodResolver(UpdatePermissionBody),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      method: "GET",
      resource: "USERS",
      active: true,
    },
  });

  useEffect(() => {
    if (permission) {
      form.reset({
        name: permission.name,
        description: permission.description || "",
        url: permission.url,
        method: permission.method,
        resource: permission.resource,
        active: true, // Backend doesn't return active, default to true
      });
    }
  }, [permission, form]);

  const reset = () => {
    form.reset();
    setId(undefined);
  };

  const onSubmit = async (values: UpdatePermissionBodyType) => {
    try {
      const result = await updatePermissionMutation.mutateAsync({ id, body: values });
      toast({ description: result.message });
      reset();
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật permission",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={!!id} onOpenChange={(value) => !value && reset()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Permission</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin permission trong hệ thống phân quyền
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center">Đang tải...</div>
        ) : (
          <Form {...form}>
            <form
              id="edit-permission-form"
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
                    <Input placeholder="USER_READ_ALL" {...field} />
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
                    <Textarea placeholder="Get all users" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Method <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn method" />
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
                      Resource <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn resource" />
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
                    URL <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="/api/users" {...field} />
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
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm">
                    {field.value ? "Active" : "Inactive"}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        )}
        <DialogFooter>
          <Button
            type="submit"
            form="edit-permission-form"
            disabled={updatePermissionMutation.isPending || isLoading}
          >
            Cập nhật Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
