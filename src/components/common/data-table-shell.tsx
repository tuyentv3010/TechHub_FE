import * as React from "react";

import { cn } from "@/lib/utils";
import { AppSurface } from "@/components/common/app-surface";

export interface DataTableShellProps extends React.HTMLAttributes<HTMLDivElement> {
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  pagination?: React.ReactNode;
  isEmpty?: boolean;
}

export function DataTableShell({
  toolbar,
  emptyState,
  pagination,
  isEmpty,
  children,
  className,
  ...props
}: DataTableShellProps) {
  return (
    <AppSurface
      as="div"
      padding="none"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {toolbar ? (
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
          {toolbar}
        </div>
      ) : null}
      {isEmpty && emptyState ? (
        <div className="p-4 sm:p-5">{emptyState}</div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
      {pagination ? (
        <div className="border-t border-border bg-muted/25 px-4 py-3 sm:px-5">
          {pagination}
        </div>
      ) : null}
    </AppSurface>
  );
}
