import http from "@/lib/http";
import {
  RoleListResType,
  RoleDetailResType,
  CreateRoleBodyType,
  UpdateRoleBodyType,
  AssignPermissionsBodyType,
  AssignRolesBodyType,
} from "@/schemaValidations/role.schema";

const roleApiRequest = {
  // List all roles
  getRoles: () =>
    http.get<RoleListResType>("/app/api/proxy/admin/roles"),

  // Get single role
  getRole: (id: string) =>
    http.get<RoleDetailResType>(`/app/api/proxy/admin/roles/${id}`),

  // Create role
  createRole: (body: CreateRoleBodyType) =>
    http.post<RoleDetailResType>("/app/api/proxy/admin/roles", body),

  // Update role
  updateRole: (id: string, body: UpdateRoleBodyType) =>
    http.put<RoleDetailResType>(`/app/api/proxy/admin/roles/${id}`, body),

  // Delete role
  deleteRole: (id: string) =>
    http.delete<any>(`/app/api/proxy/admin/roles/${id}`),

  // Assign permissions to role
  assignPermissionsToRole: (roleId: string, body: AssignPermissionsBodyType) =>
    http.post<any>(`/app/api/proxy/admin/roles/${roleId}/permissions`, body),

  // Remove permission from role
  removePermissionFromRole: (roleId: string, permissionId: string) =>
    http.delete<any>(`/app/api/proxy/admin/roles/${roleId}/permissions/${permissionId}`),

  // Get user roles
  getUserRoles: (userId: string) =>
    http.get<RoleListResType>(`/app/api/proxy/admin/users/${userId}/roles`),

  // Assign roles to user
  assignRolesToUser: (userId: string, body: AssignRolesBodyType) =>
    http.post<any>(`/app/api/proxy/admin/users/${userId}/roles`, body),

  // Remove role from user
  removeRoleFromUser: (userId: string, roleId: string) =>
    http.delete<any>(`/app/api/proxy/admin/users/${userId}/roles/${roleId}`),

  // Get effective permissions for user
  getUserEffectivePermissions: (userId: string) =>
    http.get<any>(`/app/api/proxy/users/${userId}/permissions/effective`),

  // Check user permission
  checkUserPermission: (userId: string, body: { url: string; method: string }) =>
    http.post<any>(`/app/api/proxy/users/${userId}/permissions/check`, body),
};

export default roleApiRequest;
