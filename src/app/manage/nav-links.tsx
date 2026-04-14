"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import menuItems, { MenuItem } from "@/app/manage/menuItems";
import { Role } from "@/constants/type";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccountProfile } from "@/queries/useAccount";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavLinksProps = {
  collapsed: boolean;
};

export default function NavLinks({ collapsed }: NavLinksProps) {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const account = data?.payload?.data;
  const userRoles: string[] = account?.roles || [];
  const isLearner = userRoles.includes(Role.Learner);
  const isCourseStudio = pathname.startsWith("/manage/courses");

  useEffect(() => {
    if (!isProfileLoading && isLearner) {
      router.push("/");
    }
  }, [isProfileLoading, isLearner, router]);

  if (isLearner) {
    return null;
  }

  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    if (item.roles && item.roles.length > 0) {
      const hasRole = item.roles.some((role) => userRoles.includes(role));
      if (!hasRole) return false;
    }

    if (item.requiredPermission && isPermissionsLoading) {
      return false;
    }

    if (item.requiredPermission) {
      return hasPermission(
        item.requiredPermission.method,
        item.requiredPermission.url
      );
    }

    return true;
  });

  return (
    <TooltipProvider>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "manage-sidebar manage-glass fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-300 lg:flex",
          collapsed ? "w-[5.25rem]" : "w-[17rem]"
        )}
      >
        <nav
          className={cn(
            "manage-sidebar-nav flex h-full min-h-0 flex-col",
            collapsed ? "gap-4 px-3 py-5" : "gap-6 px-4 py-6"
          )}
        >
          <Link
            href="/"
            className={cn(
              "manage-sidebar-brand transition-colors hover:bg-white/70 dark:hover:bg-white/10",
              collapsed
                ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5"
                : "rounded-3xl border border-white/10 bg-white/70 px-4 py-4 dark:bg-white/5"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-primary dark:from-[#adc6ff]/15 dark:to-[#4d8eff]/20">
                <Package2 className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="manage-display truncate text-lg font-extrabold tracking-tight text-foreground">
                    {isCourseStudio ? t("curriculumStudio") : t("executiveConsole")}
                  </p>
                  <p className="manage-page-eyebrow">
                    {isCourseStudio ? t("architecturalCurator") : t("commandDeck")}
                  </p>
                </div>
              ) : null}
            </div>
          </Link>

          <div className="manage-sidebar-scroll min-h-0 flex-1 pr-1">
            {(isProfileLoading || isPermissionsLoading) && (
              <div
                className={cn(
                  "text-muted-foreground",
                  collapsed
                    ? "px-1 text-center text-[0.65rem]"
                    : "rounded-2xl border border-white/10 bg-white/60 px-4 py-3 text-xs dark:bg-white/5"
                )}
              >
                {t("loadingNavigation")}
              </div>
            )}

            {!isProfileLoading && !isPermissionsLoading && (
              <div className={cn(collapsed ? "space-y-2" : "space-y-1")}>
                {accessibleMenuItems.map((item: MenuItem, index: number) => {
                  const isActive = pathname === item.href;
                  const label = item.titleKey ? t(item.titleKey) : item.title;

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          data-collapsed={collapsed}
                          className={cn(
                            "manage-sidebar-link group transition-all",
                            collapsed
                              ? "flex items-center justify-center rounded-2xl px-2 py-2.5"
                              : "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium",
                            isActive
                              ? "bg-slate-900 text-white shadow-lg shadow-blue-500/10 dark:bg-white/10 dark:text-white"
                              : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"
                          )}
                          >
                            <span
                              className={cn(
                                "manage-sidebar-icon flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/70 transition-colors dark:bg-white/5",
                                isActive &&
                                  "border-blue-400/20 bg-white/20 text-white dark:border-white/10 dark:bg-white/10"
                              )}
                            >
                              <item.Icon className="h-5 w-5" />
                            </span>
                          {!collapsed ? (
                            <div className="manage-sidebar-meta min-w-0 flex-1">
                              <div className="truncate font-semibold">{label}</div>
                              <div className="manage-page-eyebrow truncate text-[0.58rem]">
                                {item.href
                                  .replace("/manage/", "")
                                  .replace("/", " / ")}
                              </div>
                            </div>
                          ) : null}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>

          <div className={cn("mt-auto shrink-0", collapsed ? "space-y-2" : "space-y-3")}>
            {!collapsed ? (
              <div className="manage-sidebar-session rounded-2xl border border-white/10 bg-white/60 px-4 py-3 dark:bg-white/5">
                <p className="manage-page-eyebrow">{t("session")}</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {account?.username || "Admin workspace"}
                </p>
                <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {(userRoles[0] || "STAFF").replace(/_/g, " ")}
                </p>
              </div>
            ) : null}

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/setting"
                  data-collapsed={collapsed}
                  className={cn(
                    "manage-sidebar-link",
                    collapsed
                      ? "flex items-center justify-center rounded-2xl px-2 py-2.5 transition-colors"
                      : "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
                    pathname === "/setting"
                      ? "bg-slate-900 text-white shadow-lg shadow-blue-500/10 dark:bg-white/10 dark:text-white"
                      : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"
                  )}
                >
                  <span className="manage-sidebar-icon flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/70 dark:bg-white/5">
                    <Settings className="h-5 w-5" />
                  </span>
                  {!collapsed ? (
                    <div className="manage-sidebar-meta min-w-0">
                      <div className="font-semibold">{t("settings")}</div>
                      <div className="manage-page-eyebrow truncate text-[0.58rem]">
                        {t("systemPreferences")}
                      </div>
                    </div>
                  ) : null}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{t("settings")}</TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
