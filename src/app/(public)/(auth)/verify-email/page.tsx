import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import NewVerifyEmailForm from "./new-verify-email-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("VerifyEmail");
  return {
    title: t("title") || "Verify Email",
  };
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <NewVerifyEmailForm />
    </Suspense>
  );
}
