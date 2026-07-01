import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CourseTable = dynamic(() => import("./course-table"));
const SkillManager = dynamic(() => import("@/components/manage/SkillManager"));
const TagManager = dynamic(() => import("@/components/manage/TagManager"));

export default async function ManageCoursesPage() {
  const t = await getTranslations("ManageCourse");

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="p-5 md:p-7">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="mb-5 h-auto p-1">
            <TabsTrigger value="courses" className="px-4 py-2">
              {t("TabCourses")}
            </TabsTrigger>
            <TabsTrigger value="skills" className="px-4 py-2">
              {t("TabSkills")}
            </TabsTrigger>
            <TabsTrigger value="tags" className="px-4 py-2">
              {t("TabTags")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <Suspense>
              <CourseTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="skills">
            <Suspense>
              <SkillManager embedded />
            </Suspense>
          </TabsContent>

          <TabsContent value="tags">
            <Suspense>
              <TagManager embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      </AdminSurface>
    </AdminPageFrame>
  );
}
