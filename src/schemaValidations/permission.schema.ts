import z from "zod";

// Permission methods enum
export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
export const PermissionMethod = z.enum(HTTP_METHODS);

// Permission resources
export const RESOURCES = [
  "USERS",
  "ROLES",
  "PERMISSIONS",
  "COURSES",
  "BLOGS",
  "LEARNING_PATHS",
  "ADMIN",
  "AI",
  "FILES",
  "MANAGE",
  "INSTRUCTOR_APPLICATIONS",
  "NOTIFICATIONS",
  "PAYMENT",
  "PAYOUTS",
  "REVENUE",
] as const;
export const PermissionResource = z.string().min(1).max(100);

// Permission item schema
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  method: PermissionMethod,
  resource: PermissionResource,
  source: z.enum(["ROLE", "OVERRIDE", "USER_OVERRIDE"]).optional(),
  allowed: z.boolean().optional(),
});

export type PermissionSchemaType = z.TypeOf<typeof PermissionSchema>;

// Create permission request
export const CreatePermissionBody = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  url: z.string().min(1, "URL is required").max(255),
  method: PermissionMethod,
  resource: PermissionResource,
  active: z.boolean().default(true),
});

export type CreatePermissionBodyType = z.TypeOf<typeof CreatePermissionBody>;

// Update permission request
export const UpdatePermissionBody = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  url: z.string().max(255).optional(),
  method: PermissionMethod.optional(),
  resource: PermissionResource.optional(),
  active: z.boolean().optional(),
});

export type UpdatePermissionBodyType = z.TypeOf<typeof UpdatePermissionBody>;

export const UpsertUserPermissionBody = z.object({
  permissionId: z.string().uuid(),
  allowed: z.boolean(),
  active: z.boolean().default(true),
});

export type UpsertUserPermissionBodyType = z.TypeOf<
  typeof UpsertUserPermissionBody
>;

// Permission list response
export const PermissionListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  payload: z.object({
    data: z.array(PermissionSchema),
  }),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type PermissionListResType = z.TypeOf<typeof PermissionListRes>;

export const PermissionPageRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(PermissionSchema),
  pagination: z.object({
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type PermissionPageResType = z.TypeOf<typeof PermissionPageRes>;

// Permission detail response
export const PermissionDetailRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  payload: z.object({
    data: PermissionSchema,
  }),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type PermissionDetailResType = z.TypeOf<typeof PermissionDetailRes>;

// Delete permission response
export const DeletePermissionRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  payload: z.object({
    data: z.null(),
  }),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type DeletePermissionResType = z.TypeOf<typeof DeletePermissionRes>;
