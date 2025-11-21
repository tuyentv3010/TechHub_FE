"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Newspaper, Users, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardStats() {
  const t = useTranslations("ManageDashboard");

  // Hardcoded data for preview
  const stats = [
    {
      title: t("TotalCourses"),
      value: 127,
      icon: BookOpen,
      description: t("TotalCoursesDescription"),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("TotalBlogs"),
      value: 89,
      icon: Newspaper,
      description: t("TotalBlogsDescription"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("TotalUsers"),
      value: 2543,
      icon: Users,
      description: t("TotalUsersDescription"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: t("TotalEnrollments"),
      value: 8924,
      icon: TrendingUp,
      description: t("TotalEnrollmentsDescription"),
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
