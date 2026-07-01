"use client";

import type { ComponentType } from "react";
import { Briefcase, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title?: string | null;
  subtitle?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  return [start, end].filter(Boolean).join(" – ");
}

function TimelineItem({
  entry,
  icon: Icon,
  last,
}: {
  entry: TimelineEntry;
  icon: ComponentType<{ className?: string }>;
  last: boolean;
}) {
  const period = formatPeriod(entry.startDate, entry.endDate);
  return (
    <li className="relative pb-7 pl-[52px] last:pb-0">
      {!last && <span className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-border" aria-hidden="true" />}
      <span
        className="absolute left-0 top-0.5 grid size-9 place-items-center rounded-[10px] border border-primary/20 bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {entry.title && <h3 className="font-display text-[1.05rem] font-bold text-foreground">{entry.title}</h3>}
          {period && (
            <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {period}
            </span>
          )}
        </div>
        {entry.subtitle && (
          <p className="mt-0.5 font-semibold text-primary">
            {entry.subtitle}
            {entry.location ? <span className="font-medium text-muted-foreground"> · {entry.location}</span> : null}
          </p>
        )}
        {entry.description && (
          <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
        )}
      </div>
    </li>
  );
}

/** Renders experience or education as a clean vertical timeline. */
export function CvTimeline({
  items,
  variant,
}: {
  items: TimelineEntry[];
  variant: "experience" | "education";
}) {
  const Icon = variant === "experience" ? Briefcase : GraduationCap;
  return (
    <ul className={cn("m-0 list-none p-0")}>
      {items.map((entry, i) => (
        <TimelineItem key={i} entry={entry} icon={Icon} last={i === items.length - 1} />
      ))}
    </ul>
  );
}
