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
import { useCreatePermissionMutation } from "@/queries/usePermission";
import {
  CreatePermissionBody,
  CreatePermissionBodyType,
  HTTP_METHODS,
  RESOURCES,
} from "@/schemaValidations/permission.schema";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";

export default function AddPermission({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
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
      const result = await createPermissionMutation.mutateAsync(values);
      toast({ description: result.message });
      reset();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
      toast({
        title: "Lỗi",
        description: "Không thể tạo permission",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && reset()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Thêm Permission Mới</DialogTitle>
          <DialogDescription>
            Tạo permission mới cho hệ thống phân quyền
          </DialogDescription>
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
        <DialogFooter>
          <Button
            type="submit"
            form="add-permission-form"
            disabled={createPermissionMutation.isPending}
          >
            Thêm Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
