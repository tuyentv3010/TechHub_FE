import z from "zod";

export const RegisterBody = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterBodyType = z.infer<typeof RegisterBody>;

export const LoginBody = z
  .object({
    email: z.string().min(1, { message: "required" }).email({
      message: "invalidEmail",
    }),
    password: z.string().min(6, { message: "invalidPassword" }).max(100),
  })
  .strict();

export type LoginBodyType = z.TypeOf<typeof LoginBody>;

export const LoginRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    tokenType: z.string(),
    expiresIn: z.number(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      username: z.string(),
      roles: z.array(z.string()),
      status: z.string(),
    }),
  }),
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type LoginResType = z.TypeOf<typeof LoginRes>;

export const RefreshTokenBody = z
  .object({
    refreshToken: z.string(),
  })
  .strict();

export type RefreshTokenBodyType = z.TypeOf<typeof RefreshTokenBody>;

export const RefreshTokenRes = z.object({
  statusCode: z.number(),
  error: z.string().nullable(),
  message: z.string(),
  data: z.object({
    access_token: z.string(),
    user: z.object({
      id: z.number(),
      email: z.string(),
      name: z.string(),
      role: z.object({
        id: z.number(),
        name: z.string(),
      }),
    }),
  }),
});

export type RefreshTokenResType = z.TypeOf<typeof RefreshTokenRes>;

export const LogoutBody = z
  .object({
    refreshToken: z.string(),
  })
  .strict();

export type LogoutBodyType = z.TypeOf<typeof LogoutBody>;

export const VerifyCodeBody = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 characters"),
});

export const VerifyEmailBody = z.object({
  email: z.string().email("Invalid email address"),
});

export type VerifyCodeBodyType = z.infer<typeof VerifyCodeBody>;
export type VerifyEmailBodyType = z.infer<typeof VerifyEmailBody>;

export const VerifyEmailRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.object({
    id: z.string(),
    email: z.string(),
    username: z.string(),
    status: z.string(),
  }),
  timestamp: z.string(),
  code: z.number(),
});

export type VerifyEmailResType = z.infer<typeof VerifyEmailRes>;

export const ResendCodeRes = z.object({
  success: z.boolean(),
  status: z.string().optional(),
  message: z.string(),
  timestamp: z.string(),
  code: z.number(),
});

export type ResendCodeResType = z.infer<typeof ResendCodeRes>;

// Forgot Password Schema
export const ForgotPasswordBody = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBody>;

export const ForgotPasswordRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  code: z.number(),
});

export type ForgotPasswordResType = z.infer<typeof ForgotPasswordRes>;

// Reset Password Schema
export const ResetPasswordBody = z
  .object({
    otp: z.string().length(6, "OTP must be 6 characters"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBody>;

export const ResetPasswordRes = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  code: z.number(),
});

export type ResetPasswordResType = z.infer<typeof ResetPasswordRes>;

export interface RegisterResType {
  userId: number;
  email: string;
  fullName: string;
  citizenId: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  createdAt: string;
  codeExpired: string;
}
