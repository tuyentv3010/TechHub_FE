import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResetPassword");
  return {
    title: t("title") || "Reset Password",
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <div className="min-h-screen flex items-center justify-center">
        <ResetPasswordForm />
      </div>
    </Suspense>
  );
}
