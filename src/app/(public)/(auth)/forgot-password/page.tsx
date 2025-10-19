import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import NewForgotPasswordForm from "./new-forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ForgotPassword");
  return {
    title: t("title") || "Forgot Password",
  };
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <NewForgotPasswordForm />
    </Suspense>
  );
}
