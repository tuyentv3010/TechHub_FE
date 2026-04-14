import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import TableSkeleton from "@/components/Skeleton";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

import RoleTable from "./role-table";

export default async function ManageRolesPage() {
  const t = await getTranslations("ManageRole");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense fallback={<TableSkeleton />}>
          <RoleTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
