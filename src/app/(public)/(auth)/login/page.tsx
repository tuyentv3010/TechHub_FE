import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import NewLoginForm from "./new-login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Login");
  return {
    title: t("title") || "Login",
  };
}
export default function Login() {
  return (
    <Suspense>
      <NewLoginForm />
    </Suspense>
  );
}
