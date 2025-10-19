import { z } from "zod";

// Schema for a single account (matching new API structure)
export const AccountSchema = z.object({
  id: z.string(), // UUID
  email: z.string().email("Invalid email address"),
  username: z.string().min(1, "Username is required"),
  roles: z.array(z.string()), // Array of role names like ["ADMIN", "LEARNER"]
  status: z.string(), // "ACTIVE", "INACTIVE", etc.
  created: z.string(),
  updated: z.string(),
  isActive: z.boolean(),
  avatar: z.string().optional(), // May not exist in API but keep for future
  phoneNumber: z.string().optional(),
  citizenId: z.string().optional(),
});

export type AccountType = z.TypeOf<typeof AccountSchema>;

// Schema for creating an account
export const CreateEmployeeAccountBody = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    username: z.string().min(1, "Username is required"),
    roles: z.array(z.string()).min(1, "At least one role is required"),
    avatar: z.string().optional(),
    phoneNumber: z.string().optional(),
    citizenId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateEmployeeAccountBodyType = z.TypeOf<
  typeof CreateEmployeeAccountBody
>;

// Schema for updating an account
export const UpdateEmployeeAccountBody = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z.string().min(1, "Username is required"),
    roles: z.array(z.string()).min(1, "At least one role is required"),
    avatar: z.string().optional(),
    phoneNumber: z.string().optional(),
    citizenId: z.string().optional(),
    changePassword: z.boolean(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters")
      .optional(),
  })
  .refine(
    (data) =>
      !data.changePassword ||
      (data.password && data.password === data.confirmPassword),
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export type UpdateEmployeeAccountBodyType = z.TypeOf<
  typeof UpdateEmployeeAccountBody
>;

// Schema for single account response
export const AccountRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: AccountSchema,
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type AccountResType = z.TypeOf<typeof AccountRes>;

// Schema for account list response
export const AccountListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(AccountSchema),
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

export type AccountListResType = z.TypeOf<typeof AccountListRes>;

// Schema for account parameters (e.g., ID or email in URL)
export const AccountParams = z.object({
  id: z.string(), // UUID
});

export type AccountParamsType = z.TypeOf<typeof AccountParams>;
export enum CustomerObjectEnum {
  children = "children",
  student = "student",
  elderly = "elderly",
  veteran = "veteran",
  disabled = "disabled",
  adult = "adult",
}
