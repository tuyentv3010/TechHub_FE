import http from "@/lib/http";
import {
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  RegisterResType,
  ForgotPasswordBodyType,
  ForgotPasswordResType,
  ResetPasswordBodyType,
  ResetPasswordResType,
} from "@/schemaValidations/auth.schema";

const authApiRequest = {
  // Client-side methods
  // Register API - POST /api/proxy/auth/register
  register: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/api/proxy/auth/register", body),

  // Login API - POST /api/proxy/auth/login
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/proxy/auth/login", body),

  // Forgot Password API - POST /api/proxy/users/forgot-password
  forgotPassword: (body: ForgotPasswordBodyType) =>
    http.post<ForgotPasswordResType>("/api/proxy/users/forgot-password", body),

  // Reset Password API - POST /api/proxy/users/reset-password/:email
  resetPassword: (email: string, body: ResetPasswordBodyType) =>
    http.post<ResetPasswordResType>(`/api/proxy/users/reset-password/${email}`, body),

  // Set token to cookie (for OAuth flow)
  setTokenToCookie: (body: { accessToken: string; refreshToken: string }) =>
    http.post("/api/auth/token", body, {
      baseUrl: "",
    }),

  // Logout
  logout: () =>
    http.post(
      "/api/auth/logout",
      {},
      {
        baseUrl: "",
      }
    ),

  // Server-side methods (for Next.js API routes)
  sRegister: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/api/proxy/auth/register", body),

  sLogin: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/proxy/auth/login", body),

  sLogout: (body: {
    accessToken: string;
    refreshToken: string;
  }) =>
    http.post("/api/proxy/auth/logout", body),
};

export default authApiRequest;
