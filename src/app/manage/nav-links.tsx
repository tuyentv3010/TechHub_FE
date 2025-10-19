"use client";
import { useAccountProfile } from "@/queries/useAccount"; // Replace useAppContext
import menuItems from "@/app/manage/menuItems"; // Named import for the array
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Package2, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Import types from menuItems.tsx

// Define permission type
interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

// Mapping of href to module for permission checking
const hrefToModuleMap: Record<string, string> = {

  "/manage/accounts": "USERS",
  "/manage/roles": "ROLES",
  "/manage/permissions": "PERMISSIONS",
};

export default function NavLinks() {
  const pathname = usePathname();
  const { data, isLoading, isError, error } = useAccountProfile();
  console.log(">>>>", data); // Log data for debugging
  const account = data?.payload?.data;
  const userRoles = account?.roles as string[] | undefined;

  // Filter menu items based on roles (simplified)
  // TODO: Implement proper role-to-permission mapping if needed
  const accessibleMenuItems = menuItems.filter((item: any) => {
    if (isLoading || isError || !userRoles) return true; // Show all during loading or if roles are unavailable
    // For now, show all items to ADMIN, or implement specific role checks
    return userRoles.includes("ADMIN") || userRoles.includes("INSTRUCTOR");
  });

  if (isLoading) {
    return <div></div>; // Loading state
  }

  if (isError) {
    console.error("Account profile error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return <div></div>; // Error state
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
            <span className="sr-only">Acme Inc</span>
          </Link>

          {accessibleMenuItems.map((item: any, index: number) => {
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
                href="/manage/setting"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                  {
                    "bg-accent text-accent-foreground":
                      pathname === "/manage/setting",
                    "text-muted-foreground": pathname !== "/manage/setting",
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
