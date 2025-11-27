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
  VerifyCodeBodyType,
  VerifyEmailResType,
  VerifyEmailBodyType,
  ResendCodeResType,
} from "@/schemaValidations/auth.schema";
import { 
  ChangePasswordBodyType, 
  ChangePasswordResType 
} from "@/schemaValidations/password.schema";

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

  // Verify Email API - POST /app/api/proxy/auth/verify-email
  verifyEmail: (body: VerifyCodeBodyType) =>
    http.post<VerifyEmailResType>("/app/api/proxy/auth/verify-email", body),

  // Resend Code API - POST /app/api/proxy/auth/resend-code
  resendCode: (body: VerifyEmailBodyType) =>
    http.post<ResendCodeResType>("/app/api/proxy/auth/resend-code", body),

  // Resend Reset Password Code API - POST /app/api/proxy/users/resend-reset-code/:email
  resendResetCode: (email: string) =>
    http.post<ResendCodeResType>(`/app/api/proxy/users/resend-reset-code/${email}`, {}),

  // Change Password API - PUT /app/api/proxy/auth/change-password
  changePassword: (body: ChangePasswordBodyType) =>
    http.post<ChangePasswordResType>("/app/api/proxy/auth/change-password", body),

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

  // OAuth2 URLs - Direct backend endpoints (no HTTP wrapper needed)
  getGoogleOAuthUrl: () => `${process.env.NEXT_PUBLIC_API_ENDPOINT}/oauth2/authorization/google`,
  getGithubOAuthUrl: () => `${process.env.NEXT_PUBLIC_API_ENDPOINT}/oauth2/authorization/github`,
  getFacebookOAuthUrl: () => `${process.env.NEXT_PUBLIC_API_ENDPOINT}/oauth2/authorization/facebook`,
};

export default authApiRequest;
