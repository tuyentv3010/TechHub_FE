import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import roleApiRequest from "@/apiRequests/role";
import {
  CreateRoleBodyType,
  UpdateRoleBodyType,
  AssignPermissionsBodyType,
  AssignRolesBodyType,
} from "@/schemaValidations/role.schema";
import { UpsertUserPermissionBodyType } from "@/schemaValidations/permission.schema";

// Get all roles
export const useGetRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => roleApiRequest.getRoles(),
  });
};

// Get single role
export const useGetRole = (id: string, enabled: boolean = true) => {
  console.log('[useGetRole Hook] Called with:', { id, enabled });
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => {
      console.log('[useGetRole Hook] Fetching role:', id);
      return roleApiRequest.getRole(id);
    },
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
    mutationFn: ({ id, body }: { id: string; body: UpdateRoleBodyType }) => {
      console.log('[useUpdateRoleMutation] Mutation started:', { id, body });
      return roleApiRequest.updateRole(id, body);
    },
    onSuccess: (data) => {
      console.log('[useUpdateRoleMutation] Mutation SUCCESS:', data);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error) => {
      console.error('[useUpdateRoleMutation] Mutation ERROR:', error);
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

export const useGetUserPermissionOverrides = (
  userId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["user-permission-overrides", userId],
    queryFn: () => roleApiRequest.getUserPermissionOverrides(userId),
    enabled: enabled && !!userId,
  });
};

export const useGetUserPermissionCatalog = (
  userId: string,
  params: { page: number; size: number; search?: string },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["user-permission-catalog", userId, params],
    queryFn: () => roleApiRequest.getUserPermissionCatalog(userId, params),
    enabled: enabled && !!userId,
  });
};

export const useUpsertUserPermissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string;
      body: UpsertUserPermissionBodyType;
    }) => roleApiRequest.upsertUserPermission(userId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-permission-overrides", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-permission-catalog", variables.userId],
      });
    },
  });
};

export const useDeleteUserPermissionOverrideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissionId,
    }: {
      userId: string;
      permissionId: string;
    }) => roleApiRequest.deleteUserPermissionOverride(userId, permissionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-permission-overrides", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-permission-catalog", variables.userId],
      });
    },
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
