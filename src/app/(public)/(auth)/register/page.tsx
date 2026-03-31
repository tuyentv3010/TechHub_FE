import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import AuthForm from "../_components/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Register");
  return {
    title: t("title"),
  };
}
export default function Register() {
  return (
    <Suspense>
      <AuthForm initialMode="register" />
    </Suspense>
  );
}
