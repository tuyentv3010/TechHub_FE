"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import NavLinks from "@/app/manage/nav-links";
import MobileNavLinks from "@/app/manage/mobile-nav-links";
import { SwitchLanguage } from "@/components/switch-language";
import DropdownAvatar from "./dropdown-avatar";
import NotificationBell from "@/components/organisms/NotificationBell";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";
import { DashboardShell } from "@/components/layout";
import menuItems, { canAccessMenuItem } from "@/app/manage/menuItems";
import { usePermissions } from "@/hooks/usePermissions";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("AdminShell");
  const navT = useTranslations("AdminNav");
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();

  useEffect(() => {
    const stored = window.localStorage.getItem("manage-sidebar-collapsed");
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "manage-sidebar-collapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  const headerMeta = useMemo(() => {
    if (pathname.startsWith("/manage/courses")) {
      return {
        eyebrow: t("courseEyebrow"),
        description: t("courseDescription"),
      };
    }

    if (pathname.startsWith("/manage/payouts")) {
      return {
        eyebrow: t("payoutEyebrow"),
        description: t("payoutDescription"),
      };
    }

    if (pathname.startsWith("/manage/revenue")) {
      return {
        eyebrow: t("revenueEyebrow"),
        description: t("revenueDescription"),
      };
    }

    if (pathname.startsWith("/manage/learning-paths")) {
      return {
        eyebrow: t("pathEyebrow"),
        description: t("pathDescription"),
      };
    }

    return {
      eyebrow: t("workspaceEyebrow"),
      description: t("workspaceDescription"),
    };
  }, [pathname, t]);

  const currentMenuItem = useMemo(() => {
    return [...menuItems]
      .sort((left, right) => right.href.length - left.href.length)
      .find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      );
  }, [pathname]);

  const canAccessCurrentPage =
    !currentMenuItem ||
    canAccessMenuItem(currentMenuItem, hasPermission);
  const currentPageHasBaseAccess = Boolean(currentMenuItem?.baseAccess);
  const isCourseContentPage =
    /^\/manage\/courses\/[^/]+\/content(?:\/.*)?$/.test(pathname);
  const canAccessCourseContentPage =
    !isCourseContentPage ||
    (hasPermission("GET", "/manage/courses") &&
      hasPermission("GET", "/api/courses/{id}") &&
      hasPermission("GET", "/api/courses/{id}/chapters") &&
      (hasPermission("POST", "/api/courses/{id}/chapters") ||
        hasPermission("PUT", "/api/courses/{courseId}/chapters/{chapterId}") ||
        hasPermission("POST", "/api/courses/{courseId}/chapters/{chapterId}/lessons") ||
        hasPermission("PUT", "/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}") ||
        hasPermission("POST", "/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/assets") ||
        hasPermission("PUT", "/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/assets/{assetId}")));

  const isUnauthorizedPage = pathname === "/manage/unauthorized";
  const shouldHoldContent =
    !isUnauthorizedPage &&
    !!currentMenuItem &&
    !currentPageHasBaseAccess &&
    (isPermissionsLoading || !canAccessCurrentPage || !canAccessCourseContentPage);

  useEffect(() => {
    if (
      isUnauthorizedPage ||
      isPermissionsLoading ||
      !currentMenuItem ||
      (canAccessCurrentPage && canAccessCourseContentPage)
    ) {
      return;
    }

    router.replace("/manage/unauthorized");
  }, [
    canAccessCurrentPage,
    canAccessCourseContentPage,
    currentMenuItem,
    isPermissionsLoading,
    isUnauthorizedPage,
    router,
  ]);

  return (
    <AiLearningPathProvider>
      <DashboardShell
        sidebar={
          <NavLinks collapsed={sidebarCollapsed} />
        }
        sidebarCollapsed={sidebarCollapsed}
        header={
          <header className="manage-glass sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileNavLinks />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="app-control app-control-icon hidden lg:inline-flex"
                onClick={() => setSidebarCollapsed((current) => !current)}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <div className="hidden sm:block">
                <p className="manage-page-eyebrow">{headerMeta.eyebrow}</p>
                <p className="text-sm font-semibold text-foreground/90">
                  {headerMeta.description}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <SwitchLanguage compactOnMobile />
              <ThemeToggle />
              <NotificationBell />
              <DropdownAvatar />
            </div>
          </header>
        }
      >
        {shouldHoldContent ? (
          <div className="p-6 text-sm text-muted-foreground">
            {navT("loadingNavigation")}
          </div>
        ) : (
          children
        )}
      </DashboardShell>
    </AiLearningPathProvider>
  );
}
