import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");

  return (
    <LegalDocumentPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      lastUpdatedLabel={t("lastUpdatedLabel")}
      lastUpdated={t("lastUpdated")}
      sections={t.raw("sections") as LegalSection[]}
    />
  );
}
