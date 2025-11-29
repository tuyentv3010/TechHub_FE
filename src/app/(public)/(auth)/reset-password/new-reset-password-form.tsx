"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle, CheckCircle2 } from "lucide-react";
import { useResetPasswordMutation, useResendResetCodeMutation } from "@/queries/useAuth";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResetPasswordBody, ResetPasswordBodyType } from "@/schemaValidations/auth.schema";

interface OTPFormData {
  otp1: string;
  otp2: string;
  otp3: string;
  otp4: string;
  otp5: string;
  otp6: string;
  newPassword: string;
  confirmPassword: string;
}

export default function NewResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const errorMessageT = useTranslations("ValidationErrors");
  const resetPasswordMutation = useResetPasswordMutation();
  const resendResetCodeMutation = useResendResetCodeMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resetSuccess, setResetSuccess] = useState(false);

  // Refs for OTP inputs
  const otp1Ref = useRef<HTMLInputElement | null>(null);
  const otp2Ref = useRef<HTMLInputElement | null>(null);
  const otp3Ref = useRef<HTMLInputElement | null>(null);
  const otp4Ref = useRef<HTMLInputElement | null>(null);
  const otp5Ref = useRef<HTMLInputElement | null>(null);
  const otp6Ref = useRef<HTMLInputElement | null>(null);

  const form = useForm<OTPFormData>({
    defaultValues: {
      otp1: "",
      otp2: "",
      otp3: "",
      otp4: "",
      otp5: "",
      otp6: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleOTPInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    currentField: keyof OTPFormData,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    let value = e.target.value;

    // Only allow numbers and take only the last character
    value = value.replace(/\D/g, '').slice(-1);
    
    // Update the input value
    e.target.value = value;

    // Update form value
    form.setValue(currentField, value);

    // Auto focus to next input
    if (value && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  const handleOTPKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prevRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !e.currentTarget.value && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      form.setValue("otp1", pastedData[0] || "");
      form.setValue("otp2", pastedData[1] || "");
      form.setValue("otp3", pastedData[2] || "");
      form.setValue("otp4", pastedData[3] || "");
      form.setValue("otp5", pastedData[4] || "");
      form.setValue("otp6", pastedData[5] || "");
      otp6Ref.current?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("emailRequired"),
      });
      return;
    }

    try {
      const result = await resendResetCodeMutation.mutateAsync(email);

      if (result.payload.success) {
        toast({
          title: t("success"),
          description: "Reset code resent to your email",
        });
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.payload.message || "Failed to resend code",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || "Failed to resend code",
      });
    }
  };

  const onSubmit = async (data: OTPFormData) => {
    if (resetPasswordMutation.isPending) {
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("emailRequired"),
      });
      return;
    }

    const otp = `${data.otp1}${data.otp2}${data.otp3}${data.otp4}${data.otp5}${data.otp6}`;

    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: "Please enter all 6 digits",
      });
      return;
    }

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: errorMessageT("Passwords do not match"),
      });
      return;
    }

    try {
      const resetData: ResetPasswordBodyType = {
        otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      const result = await resetPasswordMutation.mutateAsync({
        email,
        body: resetData,
      });

      if (result.payload.success) {
        setResetSuccess(true);
        toast({
          title: t("success"),
          description: t("successMessage"),
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.payload.message || t("errorMessage"),
        });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("errorMessage"),
      });
    }
  };

  // Success Screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            {/* Logo */}
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {t("success")}
            </h1>
            <p className="text-gray-600 mb-8">
              {t("successDescription")}
            </p>

            {/* Go to Login Button */}
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {t("goToLogin")}
            </Button>
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
              {t("description")}{" "}
              <span className="font-medium">
                {email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : ""}
              </span>
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* OTP Input Fields */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t("otp")}
                </Label>
                <div className="flex gap-3 justify-between" onPaste={handleOTPPaste}>
                  {[
                    { name: "otp1" as const, ref: otp1Ref, next: otp2Ref, prev: null },
                    { name: "otp2" as const, ref: otp2Ref, next: otp3Ref, prev: otp1Ref },
                    { name: "otp3" as const, ref: otp3Ref, next: otp4Ref, prev: otp2Ref },
                    { name: "otp4" as const, ref: otp4Ref, next: otp5Ref, prev: otp3Ref },
                    { name: "otp5" as const, ref: otp5Ref, next: otp6Ref, prev: otp4Ref },
                    { name: "otp6" as const, ref: otp6Ref, next: null, prev: otp5Ref },
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem className="flex-1">
                          <Input
                            {...formField}
                            ref={field.ref}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-full h-14 text-center text-2xl font-semibold border-2 focus:border-blue-600 rounded-lg"
                            onChange={(e) => {
                              formField.onChange(e);
                              handleOTPInput(e, field.name, field.next);
                            }}
                            onKeyDown={(e) => handleOTPKeyDown(e, field.prev)}
                          />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* New Password Field */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field, formState: { errors } }) => (
                  <FormItem>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      {t("newPassword")}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.newPassword?.message &&
                        (errorMessageT(errors.newPassword.message as any) ||
                          errors.newPassword.message)}
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
                      {t("confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="h-12 mt-1"
                      {...field}
                    />
                    <FormMessage>
                      {errors.confirmPassword?.message &&
                        (errorMessageT(errors.confirmPassword.message as any) ||
                          errors.confirmPassword.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending && (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                )}
                {t("resetPassword")}
              </Button>

              {/* Resend & Back to Login links */}
              <div className="text-center text-sm text-gray-600 space-y-2">
                <div>
                  {t("didNotReceiveCode")}{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="font-medium text-blue-600 hover:text-blue-700"
                    disabled={resendResetCodeMutation.isPending}
                  >
                    {t("resendCode")}
                  </button>
                </div>
                <div>
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {t("backToLogin")}
                  </Link>
                </div>
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
