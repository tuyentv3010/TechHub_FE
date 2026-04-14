import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

import FileTable from "./file-table";

export const metadata = {
  title: "Quan ly File | TechHub",
  description: "Quan ly file va media library",
};

export default async function FilesPage() {
  const t = await getTranslations("ManageFile");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-[1.15rem]" />}>
          <FileTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
