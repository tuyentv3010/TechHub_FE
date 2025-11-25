"use client";
import { useAccountProfile } from "@/queries/useAccount";
import menuItems, { MenuItem } from "@/app/manage/menuItems";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Package2, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavLinks() {
  const pathname = usePathname();
  const { data, isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  
  const account = data?.payload?.data;

  // Filter menu items based on permissions
  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    // If no permission required, show the item
    if (!item.requiredPermission) {
      return true;
    }

    // If still loading permissions, don't show permission-restricted items yet
    if (isPermissionsLoading) {
      return false;
    }

    // Check if user has the required permission
    const hasAccess = hasPermission(
      item.requiredPermission.method,
      item.requiredPermission.url
    );
    
    console.log(`🔍 [MobileNav] Menu "${item.title}": ${hasAccess ? "✅ SHOW" : "❌ HIDE"} (${item.requiredPermission.method} ${item.requiredPermission.url})`);
    
    return hasAccess;
  });

  if (isProfileLoading || isPermissionsLoading) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">TechHub</span>
            </Link>
            <div className="text-sm text-muted-foreground">Đang tải menu...</div>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">TechHub</span>
          </Link>
          {accessibleMenuItems.map((item: MenuItem, index: number) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-2.5 hover:text-foreground",
                  {
                    "text-foreground": isActive,
                    "text-muted-foreground": !isActive,
                  }
                )}
              >
                <item.Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
