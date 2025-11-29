import { z } from "zod";

// Schema for changing password
export const ChangePasswordBody = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordBodyType = z.TypeOf<typeof ChangePasswordBody>;

// Schema for change password response
export const ChangePasswordRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type ChangePasswordResType = z.TypeOf<typeof ChangePasswordRes>;
