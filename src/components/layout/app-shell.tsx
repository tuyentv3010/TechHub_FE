import * as React from "react";

import { cn } from "@/lib/utils";

type ShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PublicShell({
  children,
  floatingAction,
  className,
}: ShellProps & {
  floatingAction?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "public-shell flex min-h-screen w-full flex-col bg-background text-foreground",
        className
      )}
    >
      <main className="min-w-0 flex-1">{children}</main>
      {floatingAction}
    </div>
  );
}

export function DashboardShell({
  sidebar,
  header,
  children,
  sidebarCollapsed,
  className,
}: ShellProps & {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  sidebarCollapsed?: boolean;
}) {
  return (
    <div className={cn("manage-shell flex min-h-screen w-full", className)}>
      {sidebar}
      <div
        className={cn(
          "min-w-0 flex-1 transition-[padding] duration-200",
          sidebarCollapsed ? "lg:pl-[5.25rem]" : "lg:pl-[17rem]"
        )}
      >
        {header}
        <div className="pb-10">{children}</div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children, className }: ShellProps) {
  return (
    <div
      className={cn(
        "workspace-shell flex min-h-screen w-full bg-background text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
