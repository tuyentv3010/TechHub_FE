import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import permissionApiRequest from "@/apiRequests/permission";
import {
  CreatePermissionBodyType,
  UpdatePermissionBodyType,
} from "@/schemaValidations/permission.schema";

// Get all permissions
export const useGetPermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApiRequest.getPermissions(),
  });
};

// Create permission
export const useCreatePermissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePermissionBodyType) =>
      permissionApiRequest.createPermission(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

// Update permission
export const useUpdatePermissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePermissionBodyType }) =>
      permissionApiRequest.updatePermission(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

// Delete permission
export const useDeletePermissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionApiRequest.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};
