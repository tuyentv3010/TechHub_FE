"use client";

import Link from "next/link";
import { Package2, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import menuItems, { MenuItem } from "@/app/manage/menuItems";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccountProfile } from "@/queries/useAccount";

export default function MobileNavLinks() {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const { data, isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const account = data?.payload?.data;
  const userRoles: string[] = account?.roles || [];
  const isCourseStudio = pathname.startsWith("/manage/courses");

  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    if (item.roles?.length) {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="manage-ghost-button h-10 w-10 rounded-full lg:hidden"
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="manage-dialog-panel w-[20rem] p-0">
        <div className="manage-sidebar-scroll flex h-full min-h-0 flex-col gap-6 p-5">
          <div className="manage-sidebar-brand rounded-3xl border border-white/10 bg-white/70 px-4 py-4 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="manage-sidebar-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Package2 className="h-5 w-5" />
              </div>
              <div className="manage-sidebar-meta min-w-0">
                <p className="manage-display truncate text-lg font-extrabold tracking-tight">
                  {isCourseStudio ? t("curriculumStudio") : t("executiveConsole")}
                </p>
                <p className="manage-page-eyebrow truncate">
                  {isCourseStudio ? t("architecturalCurator") : t("commandDeck")}
                </p>
              </div>
            </div>
          </div>

          {isProfileLoading || isPermissionsLoading ? (
            <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              {t("loadingNavigation")}
            </div>
          ) : (
            <nav className="grid gap-2">
              {accessibleMenuItems.map((item: MenuItem, index: number) => {
                const isActive = pathname === item.href;
                const label = item.titleKey ? t(item.titleKey) : item.title;

                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "manage-sidebar-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-slate-900 text-white shadow-lg shadow-blue-500/10 dark:bg-white/10 dark:text-white"
                        : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "manage-sidebar-icon flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/70 dark:bg-white/5",
                        isActive &&
                          "border-blue-400/20 bg-white/20 text-white dark:border-white/10 dark:bg-white/10"
                      )}
                    >
                      <item.Icon className="h-5 w-5" />
                    </span>
                    <div className="manage-sidebar-meta min-w-0 flex-1">
                      <div className="truncate font-semibold">{label}</div>
                      <div className="manage-page-eyebrow truncate text-[0.58rem]">
                        {item.href.replace("/manage/", "").replace("/", " / ")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
