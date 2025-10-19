import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import NewResetPasswordForm from "./new-reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResetPassword");
  return {
    title: t("title") || "Reset Password",
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <NewResetPasswordForm />
    </Suspense>
  );
}
