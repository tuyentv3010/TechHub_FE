import * as React from "react";

import { cn } from "@/lib/utils";

export interface ActionToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "between" | "end";
}

const alignClasses: Record<NonNullable<ActionToolbarProps["align"]>, string> = {
  start: "justify-start",
  between: "justify-between",
  end: "justify-end",
};

export function ActionToolbar({
  align = "between",
  className,
  ...props
}: ActionToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        alignClasses[align],
        className
      )}
      {...props}
    />
  );
}
