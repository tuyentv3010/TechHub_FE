import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import TableSkeleton from "@/components/Skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

import PermissionTable from "./permission-table";

export default async function ManagePermissionsPage() {
  const t = await getTranslations("ManagePermission");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense fallback={<TableSkeleton />}>
          <PermissionTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
