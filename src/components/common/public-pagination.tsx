"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis-left" | "ellipsis-right";

interface PublicPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

const buildPageItems = (page: number, totalPages: number): PageItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const current = Math.min(Math.max(page, 0), totalPages - 1);
  const start = Math.max(1, current - 1);
  const end = Math.min(totalPages - 2, current + 1);
  const items: PageItem[] = [0];

  if (start > 1) {
    items.push("ellipsis-left");
  }

  for (let index = start; index <= end; index += 1) {
    items.push(index);
  }

  if (end < totalPages - 2) {
    items.push("ellipsis-right");
  }

  items.push(totalPages - 1);
  return items;
};

export function PublicPagination({
  page,
  totalPages,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
}: PublicPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const pageItems = buildPageItems(safePage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      <Button
        type="button"
        variant="outline"
        disabled={safePage <= 0}
        onClick={() => onPageChange(Math.max(0, safePage - 1))}
        className="gap-1.5"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{previousLabel}</span>
      </Button>

      <div className="flex items-center gap-1">
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <Button
              key={item}
              type="button"
              variant={item === safePage ? "default" : "outline"}
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className="h-10 min-w-10 px-3"
            >
              {item + 1}
            </Button>
          ) : (
            <span
              key={item}
              className="flex h-10 w-10 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </span>
          )
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={safePage >= totalPages - 1}
        onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
        className="gap-1.5"
      >
        <span>{nextLabel}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
