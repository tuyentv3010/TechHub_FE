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
  ForgotPasswordBody,
  ForgotPasswordBodyType,
} from "@/schemaValidations/auth.schema";
import { useForgotPasswordMutation } from "@/queries/useAuth";
import Image from "next/image";
import { useState } from "react";

export default function NewForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const errorMessageT = useTranslations("ValidationErrors");
  const forgotPasswordMutation = useForgotPasswordMutation();
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordBodyType>({
    resolver: zodResolver(ForgotPasswordBody),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordBodyType) => {
    if (forgotPasswordMutation.isPending) {
      return;
    }
    try {
      const result = await forgotPasswordMutation.mutateAsync(data);
      console.log("Forgot password result:", result);

      if (result.payload.success) {
        toast({
          title: t("success"),
          description: t("checkEmail"),
        });
        setEmailSent(true);
        
        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.payload.message || t("errorMessage"),
        });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || error.payload?.message || t("errorMessage"),
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
              Forgot Password
            </h1>
            <p className="text-gray-600">
              Enter your email below and we&apos;ll send you instructions on how to reset your password.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      disabled={emailSent}
                      {...field}
                    />
                    <FormMessage>
                      {errors.email?.message &&
                        (errorMessageT(errors.email.message as any) || errors.email.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={forgotPasswordMutation.isPending || emailSent}
              >
                {forgotPasswordMutation.isPending && (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                )}
                {emailSent ? "Email Sent" : "Reset Password"}
              </Button>

              {/* Back to Login link */}
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Back to Login
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
              src="/hero/student-learning.png"
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
