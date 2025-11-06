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
  // Register API - POST /app/api/proxy/auth/register
  register: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/app/api/proxy/auth/register", body),

  // Login API - POST /app/api/proxy/auth/login
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/app/api/proxy/auth/login", body),

  // Forgot Password API - POST /app/api/proxy/users/forgot-password
  forgotPassword: (body: ForgotPasswordBodyType) =>
    http.post<ForgotPasswordResType>("/app/api/proxy/users/forgot-password", body),

  // Reset Password API - POST /app/api/proxy/users/reset-password/:email
  resetPassword: (email: string, body: ResetPasswordBodyType) =>
    http.post<ResetPasswordResType>(`/app/api/proxy/users/reset-password/${email}`, body),

  // Set token to cookie (for OAuth flow)
  setTokenToCookie: (body: { accessToken: string; refreshToken: string }) =>
    http.post("/app/api/auth/token", body, {
      baseUrl: "",
    }),

  // Logout
  logout: () =>
    http.post(
      "/app/api/auth/logout",
      {},
      {
        baseUrl: "",
      }
    ),

  // Server-side methods (for Next.js API routes)
  sRegister: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/app/api/proxy/auth/register", body),

  sLogin: (body: LoginBodyType) =>
    http.post<LoginResType>("/app/api/proxy/auth/login", body),

  sLogout: (body: {
    accessToken: string;
    refreshToken: string;
  }) =>
    http.post("/app/api/proxy/auth/logout", body),

  sRefreshToken: (body: { refreshToken: string }) =>
    http.post<LoginResType>("/auth/refresh-token", body),
};

export default authApiRequest;
