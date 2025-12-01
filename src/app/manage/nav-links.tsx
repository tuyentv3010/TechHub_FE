"use client";
import { useAccountProfile } from "@/queries/useAccount";
import menuItems, { MenuItem } from "@/app/manage/menuItems";
import { usePermissions } from "@/hooks/usePermissions";
import { Role } from "@/constants/type";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Package2, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading: isProfileLoading } = useAccountProfile();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  
  const account = data?.payload?.data;

  // Lấy roles từ profile API (array of strings, e.g., ["INSTRUCTOR", "ADMIN"])
  const userRoles: string[] = account?.roles || [];
  
  console.log("🔐 [NavLinks] Profile data:", account);
  console.log("🔐 [NavLinks] User roles:", userRoles);
  console.log("🔐 [NavLinks] Role.Learner value:", Role.Learner);
  
  // Check if user is LEARNER - redirect to home
  const isLearner = userRoles.includes(Role.Learner);
  console.log("🔐 [NavLinks] Is Learner?:", isLearner);
  useEffect(() => {
    if (!isProfileLoading && isLearner) {
      router.push("/");
    }
  }, [isProfileLoading, isLearner, router]);

  // If user is LEARNER, don't render anything
  if (isLearner) {
    return null;
  }

  // Filter menu items based on roles from profile API
  const accessibleMenuItems = menuItems.filter((item: MenuItem) => {
    // Check roles - if item has roles defined, user must have at least one matching role
    if (item.roles && item.roles.length > 0) {
      const hasRole = item.roles.some(role => userRoles.includes(role));
      if (!hasRole) {
        console.log(`🚫 [NavLinks] Menu "${item.title}": HIDDEN (user roles [${userRoles.join(', ')}] don't match required roles [${item.roles.join(', ')}])`);
        return false;
      }
    }

    // If still loading permissions, don't show permission-restricted items yet
    if (item.requiredPermission && isPermissionsLoading) {
      return false;
    }

    // Check permission if required
    if (item.requiredPermission) {
      const hasAccess = hasPermission(
        item.requiredPermission.method,
        item.requiredPermission.url
      );
      console.log(`🔍 [NavLinks] Menu "${item.title}": ${hasAccess ? "✅ SHOW" : "❌ HIDE"} (${item.requiredPermission.method} ${item.requiredPermission.url})`);
      return hasAccess;
    }

    return true;
  });

  if (isProfileLoading || isPermissionsLoading) {
    return (
      <TooltipProvider>
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-[70px] flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 py-4">
            <Link
              href="/"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">TechHub</span>
            </Link>
            <div className="text-xs text-muted-foreground">Loading...</div>
          </nav>
        </aside>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[70px] flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">TechHub</span>
          </Link>

          {accessibleMenuItems.map((item: MenuItem, index: number) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 mt-2",
                      {
                        "bg-accent text-accent-foreground": isActive,
                        "text-muted-foreground": !isActive,
                      }
                    )}
                  >
                    <item.Icon className="h-7 w-7" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/setting"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                  {
                    "bg-accent text-accent-foreground":
                      pathname === "/setting",
                    "text-muted-foreground": pathname !== "/setting",
                  }
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Cài đặt</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Cài đặt</TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
