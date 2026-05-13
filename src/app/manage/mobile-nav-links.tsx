"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import menuItems, { canAccessMenuItem, MenuItem } from "@/app/manage/menuItems";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccountProfile } from "@/queries/useAccount";

export default function MobileNavLinks() {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const { isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const isCourseStudio = pathname.startsWith("/manage/courses");
  const brandHref = "/";

  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    if (isPermissionsLoading) {
      return false;
    }

    return canAccessMenuItem(item, hasPermission);
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="app-control app-control-icon lg:hidden"
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="app-control-menu w-[20rem] p-0">
        <div className="manage-sidebar-scroll flex h-full min-h-0 flex-col gap-6 p-5">
          <Link
            href={brandHref}
            className="manage-sidebar-brand group block rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/60"
          >
            <div className="flex items-center gap-3">
              <div className="manage-sidebar-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white shadow-sm">
                <Image
                  src="/brand-mark.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </div>
              <div className="manage-sidebar-meta min-w-0 flex-1">
                <p className="manage-display break-words text-base font-extrabold leading-tight">
                  {isCourseStudio ? t("curriculumStudio") : t("executiveConsole")}
                </p>
                <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium leading-none tracking-normal text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary">
                  <ArrowLeft className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t("backToHomepage")}</span>
                </span>
              </div>
            </div>
          </Link>

          {isProfileLoading || isPermissionsLoading ? (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
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
                      "manage-sidebar-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "manage-sidebar-icon flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card",
                        isActive &&
                          "border-primary/20 bg-primary/15 text-primary-foreground"
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
