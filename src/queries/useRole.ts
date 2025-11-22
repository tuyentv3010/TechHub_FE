import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import roleApiRequest from "@/apiRequests/role";
import {
  CreateRoleBodyType,
  UpdateRoleBodyType,
  AssignPermissionsBodyType,
  AssignRolesBodyType,
} from "@/schemaValidations/role.schema";

// Get all roles
export const useGetRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => roleApiRequest.getRoles(),
  });
};

// Get single role
export const useGetRole = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => roleApiRequest.getRole(id),
    enabled: enabled && !!id,
  });
};

// Create role
export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRoleBodyType) => roleApiRequest.createRole(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Update role
export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoleBodyType }) =>
      roleApiRequest.updateRole(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Delete role
export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleApiRequest.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Assign permissions to role
export const useAssignPermissionsToRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, body }: { roleId: string; body: AssignPermissionsBodyType }) =>
      roleApiRequest.assignPermissionsToRole(roleId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Remove permission from role
export const useRemovePermissionFromRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      roleApiRequest.removePermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Get user roles
export const useGetUserRoles = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => roleApiRequest.getUserRoles(userId),
    enabled: enabled && !!userId,
  });
};

// Assign roles to user
export const useAssignRolesToUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: AssignRolesBodyType }) =>
      roleApiRequest.assignRolesToUser(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
};

// Remove role from user
export const useRemoveRoleFromUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      roleApiRequest.removeRoleFromUser(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
};
