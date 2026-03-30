import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import AuthForm from "../_components/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Login");
  return {
    title: t("title") || "Login",
  };
}
export default function Login() {
  return (
    <Suspense>
      <AuthForm initialMode="login" />
    </Suspense>
  );
}
