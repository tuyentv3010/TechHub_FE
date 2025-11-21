import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import DashboardStats from "./dashboard-stats";
import RecentActivity from "./recent-activity";
import TopCourses from "./top-courses";

export default async function DashboardPage() {
  const t = await getTranslations("ManageDashboard");

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Title")}</h1>
          <p className="text-muted-foreground mt-2">{t("Description")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <DashboardStats />
      </Suspense>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Courses */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t("TopCourses")}</CardTitle>
            <CardDescription>{t("TopCoursesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
              <TopCourses />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t("RecentActivity")}</CardTitle>
            <CardDescription>{t("RecentActivityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

