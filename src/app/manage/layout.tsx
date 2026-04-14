"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import DarkModeToggle from "@/components/dark-mode-toggle";
import NavLinks from "@/app/manage/nav-links";
import MobileNavLinks from "@/app/manage/mobile-nav-links";
import { SwitchLanguage } from "@/components/switch-language";
import DropdownAvatar from "./dropdown-avatar";
import NotificationBell from "@/components/organisms/NotificationBell";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("AdminShell");
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return (
    <AiLearningPathProvider>
      <div className="manage-shell flex min-h-screen w-full">
        <NavLinks collapsed={sidebarCollapsed} />
        <div
          className={cn(
            "min-w-0 flex-1 transition-[padding] duration-300",
            sidebarCollapsed ? "lg:pl-[5.25rem]" : "lg:pl-[17rem]"
          )}
        >
          <header className="manage-glass sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileNavLinks />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="manage-ghost-button hidden h-10 w-10 rounded-full lg:inline-flex"
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
              <SwitchLanguage className="manage-field h-10 rounded-full border-0 bg-transparent shadow-none" />
              <DarkModeToggle className="manage-ghost-button border-0 shadow-none" />
              <NotificationBell className="manage-ghost-button rounded-full border-0 shadow-none" />
              <DropdownAvatar />
            </div>
          </header>
          <div className="pb-10">{children}</div>
        </div>
      </div>
    </AiLearningPathProvider>
  );
}
