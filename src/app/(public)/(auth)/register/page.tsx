import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import NewRegisterForm from "./new-register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Register");
  return {
    title: t("title"),
  };
}
export default function Register() {
  return (
    <Suspense>
      <NewRegisterForm />
    </Suspense>
  );
}
