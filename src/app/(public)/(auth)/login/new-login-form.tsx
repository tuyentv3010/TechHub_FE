"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { LoginBody, LoginBodyType } from "@/schemaValidations/auth.schema";
import { useLoginMutation } from "@/queries/useAuth";
import { useAppContext } from "@/components/app-provider";
import envConfig from "@/config";
import Image from "next/image";
import authApiRequest from "@/apiRequests/auth";

export default function NewLoginForm() {
  const t = useTranslations("Login");
  const errorMessageT = useTranslations("ValidationErrors");
  const loginMutation = useLoginMutation();
  const router = useRouter();
  const { setIsAuth, setRole } = useAppContext();

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBody),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginBodyType) => {
    if (loginMutation.isPending) {
      return;
    }
    try {
      const result = await loginMutation.mutateAsync(data);
      console.log("Login result:", result);

      // Check if login was successful
      if (!result.payload.success) {
        toast({
          variant: "destructive",
          title: t("loginError") || "Login Failed",
          description: result.payload.message || t("loginErrorMessage"),
        });
        return;
      }

      // Check user status
      const userStatus = result.payload.data.user.status;
      if (userStatus === "INACTIVE" || userStatus === "PENDING") {
        toast({
          variant: "destructive",
          title: t("accountNotActive") || "Account Not Active",
          description: t("VerificationRequired"),
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken", result.payload.data.accessToken);
      localStorage.setItem("refreshToken", result.payload.data.refreshToken);
      
      // Store user info for header display
      localStorage.setItem("userInfo", JSON.stringify(result.payload.data.user));

      // Get user role (first role in array)
      const userRole = result.payload.data.user.roles[0] || "USER";

      // Update app context
      setIsAuth(true);
      setRole(userRole);
      
      // Success toast
      toast({
        title: t("loginSuccess") || "Login Successful",
        description: result.payload.message || `Welcome ${result.payload.data.user.username}!`,
      });

      // Redirect based on role
      if (userRole === "ADMIN") {
        router.push("/manage/accounts");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      toast({
        variant: "destructive",
        title: t("loginError") || "Login Failed",
        description: error.message || error.payload?.message || t("loginErrorMessage"),
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
   

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("title")}
            </h1>
            <p className="text-gray-600">
              {t("description")}
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Social Login Buttons */}
              <div className="space-y-3">
                {/* Google Login Button */}
                <Link href={authApiRequest.getGoogleOAuthUrl()}>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    type="button"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t("googleLogin")}
                  </Button>
                </Link>

                {/* GitHub Login Button */}
                <Link href={authApiRequest.getGithubOAuthUrl()}>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    type="button"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Continue with GitHub
                  </Button>
                </Link>

                {/* Facebook Login Button */}
                <Link href={authApiRequest.getFacebookOAuthUrl()}>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    type="button"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                </Link>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder=""
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.email?.message &&
                        errorMessageT(errors.email.message as any)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      {t("password")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.password?.message &&
                        errorMessageT(errors.password.message as any)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Remember for 30 days
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                )}
                {t("signIn")}
              </Button>

              {/* Sign up link */}
              <div className="text-center text-sm text-gray-600">
                {t("noAlreadyHaveAccount")}{" "}
                <Link href="/register" className="font-medium text-gray-900 hover:text-blue-600">
                  {t("Register")}
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full max-w-2xl">
            <Image
              src="/hero/signIn.png"
              alt="Student learning"
              fill
              className="rounded-2xl object-cover shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
