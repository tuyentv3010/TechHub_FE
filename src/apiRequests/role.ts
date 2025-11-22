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
  getRoles: () => {
    console.log('[Role API] Getting all roles');
    return http.get<RoleListResType>("/app/api/proxy/admin/roles")
      .then(response => {
        console.log('[Role API] Get roles SUCCESS:', response);
        return response;
      })
      .catch(error => {
        console.error('[Role API] Get roles ERROR:', error);
        throw error;
      });
  },

  // Get single role
  getRole: (id: string) => {
    console.log('[Role API] Getting role with ID:', id);
    console.log('[Role API] Request URL:', `/app/api/proxy/admin/roles/${id}`);
    return http.get<RoleDetailResType>(`/app/api/proxy/admin/roles/${id}`)
      .then(response => {
        console.log('[Role API] Get role SUCCESS:', response);
        return response;
      })
      .catch(error => {
        console.error('[Role API] Get role ERROR:', error);
        console.error('[Role API] Error details:', {
          status: error.status,
          message: error.message,
          payload: error.payload
        });
        throw error;
      });
  },

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
