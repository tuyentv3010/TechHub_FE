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

const CourseTable = dynamic(() => import("./course-table"));

export default async function ManageCoursesPage() {
  const t = await getTranslations("ManageCourse");
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Title")}</CardTitle>
            <CardDescription>{t("Description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <CourseTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
