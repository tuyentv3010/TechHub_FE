import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");

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
