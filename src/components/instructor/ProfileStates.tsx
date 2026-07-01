"use client";

import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Friendly empty state (e.g. instructor with no published courses). */
export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center"
    >
      <span className="mx-auto mb-4 grid size-[60px] place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <p className="font-display text-lg font-bold text-foreground">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-[42ch] text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

export function SectionShell({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-[130px] pt-11">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 id={`${id}-h`} className="font-display text-2xl font-bold text-foreground">
          {title}
        </h2>
        {count != null && <span className="text-[0.95rem] font-semibold text-muted-foreground">{count}</span>}
      </div>
      {children}
    </section>
  );
}

/* ---------------- Skeletons ---------------- */

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-3 h-3.5 w-[70%]" />
        <Skeleton className="mt-3 h-5 w-2/5" />
      </div>
    </Card>
  );
}

export function HeroSkeleton() {
  return (
    <section>
      <div className="h-[184px] bg-muted" />
      <div className="mx-auto flex max-w-[var(--content-max,1180px)] flex-wrap items-start justify-between gap-10 px-6">
        <div className="-mt-[104px] flex items-start gap-6">
          <Skeleton className="size-[140px] flex-none rounded-full ring-4 ring-background" />
          <div className="space-y-3 pt-28">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
        <div className="flex gap-3 pt-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="mx-auto max-w-[var(--content-max,1180px)] px-6 pb-20">
        <div className="pt-11">
          <Skeleton className="mb-6 h-6 w-40" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
