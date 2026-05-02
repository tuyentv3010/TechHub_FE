import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import TableSkeleton from "@/components/Skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { getAccessCopy } from "@/lib/access-control";

import PermissionTable from "./permission-table";

export default async function ManagePermissionsPage() {
  const t = await getTranslations("ManagePermission");
  const locale = await getLocale();
  const accessCopy = getAccessCopy(locale);

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={accessCopy.pageDescriptions.permissions}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense fallback={<TableSkeleton />}>
          <PermissionTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
