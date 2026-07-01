import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

const LearningPathTable = dynamic(() => import("./learning-path-table"));

export default async function ManageLearningPathsPage() {
  const t = await getTranslations("ManageLearningPath");
  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-4 sm:p-6">
        <Card className="border-border/40 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl">{t("Title")}</CardTitle>
            <CardDescription>{t("Description")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Suspense>
              <LearningPathTable />
            </Suspense>
          </CardContent>
        </Card>
      </AdminSurface>
    </AdminPageFrame>
  );
}
