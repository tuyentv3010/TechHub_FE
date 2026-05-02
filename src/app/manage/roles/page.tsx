import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import TableSkeleton from "@/components/Skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { getAccessCopy } from "@/lib/access-control";

import RoleTable from "./role-table";

export default async function ManageRolesPage() {
  const t = await getTranslations("ManageRole");
  const locale = await getLocale();
  const accessCopy = getAccessCopy(locale);

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={accessCopy.pageDescriptions.roles}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense fallback={<TableSkeleton />}>
          <RoleTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
