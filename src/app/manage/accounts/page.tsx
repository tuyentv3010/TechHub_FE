import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import AccountTable from "./account-table";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

export default async function ManageAccountsPage() {
  const t = await getTranslations("ManageAccount");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense>
          <AccountTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
