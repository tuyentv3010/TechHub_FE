import authApiRequest from "@/apiRequests/auth";
import {
  LoginBodyType,
  RegisterBodyType,
  ForgotPasswordBodyType,
  ResetPasswordBodyType,
  VerifyCodeBodyType,
  VerifyEmailBodyType,
} from "@/schemaValidations/auth.schema";
import { useMutation } from "@tanstack/react-query";

// Register mutation
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (body: RegisterBodyType) => authApiRequest.register(body),
  });
};

// Verify Email mutation
export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: (body: VerifyCodeBodyType) => authApiRequest.verifyEmail(body),
  });
};

// Resend Code mutation
export const useResendCodeMutation = () => {
  return useMutation({
    mutationFn: (body: VerifyEmailBodyType) => authApiRequest.resendCode(body),
  });
};

// Resend Reset Password Code mutation
export const useResendResetCodeMutation = () => {
  return useMutation({
    mutationFn: (email: string) => authApiRequest.resendResetCode(email),
  });
};

// Login mutation
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (body: LoginBodyType) => authApiRequest.login(body),
  });
};

// Forgot Password mutation
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (body: ForgotPasswordBodyType) => authApiRequest.forgotPassword(body),
  });
};

// Reset Password mutation
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: ({ email, body }: { email: string; body: ResetPasswordBodyType }) =>
      authApiRequest.resetPassword(email, body),
  });
};

// Set token to cookie mutation (for OAuth)
export const useSetTokenToCookieMutation = () => {
  return useMutation({
    mutationFn: (body: { accessToken: string; refreshToken: string }) =>
      authApiRequest.setTokenToCookie(body),
  });
};

// Logout mutation
export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: () => authApiRequest.logout(),
  });
};
