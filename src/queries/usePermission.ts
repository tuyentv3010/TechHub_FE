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

// Get permission by ID
export const useGetPermissionById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["permissions", id],
    queryFn: () => permissionApiRequest.getPermissionById(id!),
    enabled: !!id, // Only run query if id exists
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", variables.id] });
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
