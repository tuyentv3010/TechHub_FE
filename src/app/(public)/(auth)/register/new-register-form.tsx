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
import {
  RegisterBody,
  RegisterBodyType,
} from "@/schemaValidations/auth.schema";
import { useRegisterMutation } from "@/queries/useAuth";
import envConfig from "@/config";
import Image from "next/image";

const getOauthGoogleUrl = () => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: envConfig.NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI,
    client_id: envConfig.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

const googleOauthUrl = getOauthGoogleUrl();

export default function NewRegisterForm() {
  const t = useTranslations("Register");
  const errorMessageT = useTranslations("ErrorMessage");
  const registerMutation = useRegisterMutation();
  const router = useRouter();

  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBody),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterBodyType) => {
    if (registerMutation.isPending) {
      return;
    }
    try {
      const result = await registerMutation.mutateAsync(data);
      console.log("Register result:", result);
      
      toast({
        title: t("registerSuccess"),
        description: t("registerSuccessMessage"),
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      console.error("Register error:", error);
      toast({
        variant: "destructive",
        title: t("registerError"),
        description: error.message || t("registerErrorMessage"),
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-semibold">TechHub.</span>
            </Link>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, James
            </h1>
            <p className="text-gray-600">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Google Signup Button */}
              <Link href={googleOauthUrl}>
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
                  Sign up with Google
                </Button>
              </Link>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Name Field (optional, design shows it) */}
              <FormField
                control={form.control}
                name="username"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Name
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder=""
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.username?.message &&
                        errorMessageT(errors.username.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
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
                        errorMessageT(errors.email.message)}
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
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.password?.message &&
                        errorMessageT(errors.password.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.confirmPassword?.message &&
                        errorMessageT(errors.confirmPassword.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending && (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                )}
                Sign up
              </Button>

              {/* Sign in link */}
              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-gray-900 hover:text-blue-600">
                  Sign in
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
