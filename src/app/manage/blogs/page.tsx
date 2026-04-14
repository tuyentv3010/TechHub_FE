import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

const BlogTable = dynamic(() => import("./blog-table"));

export default async function ManageBlogsPage() {
  const t = await getTranslations("ManageBlog");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense>
          <BlogTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
