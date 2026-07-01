"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LegalBackButton() {
  const router = useRouter();
  const t = useTranslations("Legal.backButton");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-8 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      aria-label={t("ariaLabel")}
    >
      {t("label")}
    </button>
  );
}
