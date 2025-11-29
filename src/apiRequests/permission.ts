import http from "@/lib/http";
import {
  PermissionListResType,
  PermissionDetailResType,
  CreatePermissionBodyType,
  UpdatePermissionBodyType,
  DeletePermissionResType,
} from "@/schemaValidations/permission.schema";

const permissionApiRequest = {
  // List all permissions
  getPermissions: () =>
    http.get<PermissionListResType>("/app/api/proxy/admin/permissions"),

  // Get permission by ID
  getPermissionById: (id: string) =>
    http.get<PermissionDetailResType>(`/app/api/proxy/admin/permissions/${id}`),

  // Create permission
  createPermission: (body: CreatePermissionBodyType) =>
    http.post<PermissionDetailResType>("/app/api/proxy/admin/permissions", body),

  // Update permission
  updatePermission: (id: string, body: UpdatePermissionBodyType) =>
    http.put<PermissionDetailResType>(`/app/api/proxy/admin/permissions/${id}`, body),

  // Delete permission (if needed)
  deletePermission: (id: string) =>
    http.delete<DeletePermissionResType>(`/app/api/proxy/admin/permissions/${id}`),
};

export default permissionApiRequest;
