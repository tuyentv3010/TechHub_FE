import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

const CourseTable = dynamic(() => import("./course-table"));

export default async function ManageCoursesPage() {
  const t = await getTranslations("ManageCourse");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Suspense>
          <CourseTable />
        </Suspense>
      </AdminSurface>
    </AdminPageFrame>
  );
}
