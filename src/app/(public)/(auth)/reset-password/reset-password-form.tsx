"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ResetPasswordBody, ResetPasswordBodyType } from "@/schemaValidations/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LoaderCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useResetPasswordMutation } from "@/queries/useAuth";
import { useState } from "react";

export default function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const errorMessageT = useTranslations("ErrorMessage");
  const resetPasswordMutation = useResetPasswordMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resetSuccess, setResetSuccess] = useState(false);

  const form = useForm<ResetPasswordBodyType>({
    resolver: zodResolver(ResetPasswordBody),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordBodyType) => {
    if (resetPasswordMutation.isPending) {
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: t("error") || "Lỗi",
        description: t("emailRequired") || "Email không được để trống",
      });
      return;
    }
    
    try {
      const result = await resetPasswordMutation.mutateAsync({
        email,
        body: data,
      });
      console.log("Reset password result:", result);

      if (result.payload.success) {
        setResetSuccess(true);
        toast({
          title: t("success") || "Đổi mật khẩu thành công",
          description: result.payload.message || t("successMessage") || "Mật khẩu đã được thay đổi. Đang chuyển đến trang đăng nhập...",
        });
        
        // Redirect to login page
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: t("error") || "Đổi mật khẩu thất bại",
          description: result.payload.message || t("errorMessage") || "Có lỗi xảy ra, vui lòng thử lại",
        });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      toast({
        variant: "destructive",
        title: t("error") || "Đổi mật khẩu thất bại",
        description: error.message || error.payload?.message || t("errorMessage") || "Có lỗi xảy ra, vui lòng thử lại",
      });
    }
  };

  if (resetSuccess) {
    return (
      <Card className="mx-auto max-w-sm w-[400px]">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {t("success") || "Thành công!"}
          </CardTitle>
          <CardDescription className="text-center">
            {t("successDescription") || "Mật khẩu của bạn đã được thay đổi thành công"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">{t("goToLogin") || "Đi đến đăng nhập"}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-[400px]">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title") || "Đặt lại mật khẩu"}</CardTitle>
        <CardDescription>
          {t("description") || "Nhập mã OTP và mật khẩu mới"}
          {email && (
            <div className="mt-2 text-sm font-medium text-primary">
              {email}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="otp"
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">{t("otp") || "Mã OTP"}</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      required
                      {...field}
                    />
                    <FormMessage>
                      {errors.otp?.message &&
                        (errorMessageT(errors.otp.message as any) || errors.otp.message)}
                    </FormMessage>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">
                      {t("newPassword") || "Mật khẩu mới"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      required
                      {...field}
                    />
                    <FormMessage>
                      {errors.newPassword?.message &&
                        (errorMessageT(errors.newPassword.message as any) || errors.newPassword.message)}
                    </FormMessage>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">
                      {t("confirmPassword") || "Xác nhận mật khẩu"}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      {...field}
                    />
                    <FormMessage>
                      {errors.confirmPassword?.message &&
                        (errorMessageT(errors.confirmPassword.message as any) || errors.confirmPassword.message)}
                    </FormMessage>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending && (
                <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
              )}
              {t("resetPassword") || "Đặt lại mật khẩu"}
            </Button>

            <div className="text-center text-sm space-y-2">
              <div>
                {t("didNotReceiveCode") || "Không nhận được mã?"}{" "}
                <Link 
                  href="/forgot-password" 
                  className="text-primary hover:underline"
                >
                  {t("resendCode") || "Gửi lại"}
                </Link>
              </div>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToLogin") || "Quay lại đăng nhập"}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
