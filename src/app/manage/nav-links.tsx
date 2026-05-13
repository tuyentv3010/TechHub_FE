"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import menuItems, { canAccessMenuItem, MenuItem } from "@/app/manage/menuItems";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccountProfile } from "@/queries/useAccount";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavLinksProps = {
  collapsed: boolean;
};

const SESSION_COMPACT_STORAGE_KEY = "manage-session-compact";

export default function NavLinks({ collapsed }: NavLinksProps) {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const [sessionCompact, setSessionCompact] = useState(false);
  const { data, isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const account = data?.payload?.data;
  const userRoles: string[] = account?.roles || [];
  const isCourseStudio = pathname.startsWith("/manage/courses");
  const brandHref = "/";
  const sessionRole = (userRoles[0] || "STAFF").replace(/_/g, " ");
  const sessionName = account?.username || "Admin workspace";

  useEffect(() => {
    const stored = window.localStorage.getItem(SESSION_COMPACT_STORAGE_KEY);
    if (stored !== null) {
      setSessionCompact(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SESSION_COMPACT_STORAGE_KEY,
      String(sessionCompact)
    );
  }, [sessionCompact]);

  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    if (isPermissionsLoading) {
      return false;
    }

    return canAccessMenuItem(item, hasPermission);
  });

  return (
    <TooltipProvider>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "manage-sidebar manage-glass fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
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
            href={brandHref}
            className={cn(
              "manage-sidebar-brand group border border-border bg-card transition-colors hover:bg-muted/60",
              collapsed
                ? "mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                : "rounded-xl px-4 py-4"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white shadow-sm">
                <Image
                  src="/brand-mark.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </div>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="manage-display break-words text-base font-extrabold leading-tight text-foreground">
                    {isCourseStudio ? t("curriculumStudio") : t("executiveConsole")}
                  </p>
                  <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium leading-none tracking-normal text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary">
                    <ArrowLeft className="h-3 w-3 shrink-0" />
                    <span className="truncate">{t("backToHomepage")}</span>
                  </span>
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
                    : "rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs"
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
                              ? "flex items-center justify-center rounded-lg px-2 py-2.5"
                              : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "manage-sidebar-icon flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors",
                              isActive &&
                                "border-primary/20 bg-primary/15 text-primary-foreground"
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
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="manage-sidebar-link mx-auto flex min-h-11 w-14 items-center justify-center rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    data-collapsed={collapsed}
                    onClick={() => setSessionCompact((current) => !current)}
                    aria-expanded={!sessionCompact}
                  >
                    <span className="max-w-full truncate text-[0.6rem] font-bold uppercase tracking-[0.12em]">
                      {sessionRole}
                    </span>
                    <span className="sr-only">{t("session")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("session")}: {sessionName} - {sessionRole}
                </TooltipContent>
              </Tooltip>
            ) : sessionCompact ? (
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60"
                onClick={() => setSessionCompact(false)}
                aria-expanded={false}
              >
                <span className="min-w-0 flex-1 truncate text-left text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {sessionRole}
                </span>
                <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">{t("session")}</span>
              </Button>
            ) : (
              <div className="manage-sidebar-session rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="manage-page-eyebrow text-[0.62rem] tracking-[0.2em]">
                      {t("session")}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {sessionName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="app-control app-control-sm shrink-0"
                    onClick={() => setSessionCompact(true)}
                    aria-expanded
                  >
                    <Minimize2 className="h-4 w-4" />
                    <span className="sr-only">{t("session")}</span>
                  </Button>
                </div>
                <p className="mt-2 truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {sessionRole}
                </p>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
