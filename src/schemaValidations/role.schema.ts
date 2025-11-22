import { z } from "zod";
import { PermissionSchema } from "./permission.schema";

// Role schema (from API response)
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  permissionIds: z.array(z.string().uuid()),
});

export type RoleSchemaType = z.infer<typeof RoleSchema>;

// Role with full permission details
export const RoleWithPermissionsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  permissions: z.array(PermissionSchema),
});

export type RoleWithPermissionsType = z.infer<typeof RoleWithPermissionsSchema>;

// Create role request
export const CreateRoleBody = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export type CreateRoleBodyType = z.infer<typeof CreateRoleBody>;

// Update role request
export const UpdateRoleBody = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBody>;

// Assign permissions to role request
export const AssignPermissionsBody = z.object({
  permissionIds: z.array(z.string().uuid()).min(1, "At least one permission is required"),
});

export type AssignPermissionsBodyType = z.infer<typeof AssignPermissionsBody>;

// Assign roles to user request
export const AssignRolesBody = z.object({
  roleIds: z.array(z.string().uuid()).min(1, "At least one role is required"),
  active: z.boolean().default(true),
});

export type AssignRolesBodyType = z.infer<typeof AssignRolesBody>;

// Role list response
export const RoleListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(RoleSchema),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type RoleListResType = z.infer<typeof RoleListRes>;

// Role detail response
export const RoleDetailRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: RoleWithPermissionsSchema,
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type RoleDetailResType = z.infer<typeof RoleDetailRes>;
