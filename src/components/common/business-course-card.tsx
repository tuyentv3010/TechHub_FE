import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Star, Users } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BusinessCourseCardData {
  href: string;
  title: string;
  image: string;
  instructor?: string;
  instructorAvatar?: string;
  rating?: number;
  reviews?: number;
  priceLabel?: string;
  badge?: string;
  lessons?: number;
  hours?: number;
  students?: number;
  ctaLabel?: string;
}

export interface BusinessCourseCardProps {
  course: BusinessCourseCardData;
  className?: string;
}

export function BusinessCourseCard({ course, className }: BusinessCourseCardProps) {
  const rating = course.rating ?? 0;

  return (
    <Link
      href={course.href}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-card",
        className
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {course.badge ? <Badge className="bg-primary text-primary-foreground">{course.badge}</Badge> : null}
        </div>
        {course.priceLabel ? (
          <div className="absolute right-3 top-3 rounded-md border border-border bg-card/95 px-2.5 py-1 text-sm font-semibold text-foreground shadow-sm">
            {course.priceLabel}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            {course.reviews != null ? <span>({formatNumber(course.reviews)})</span> : null}
          </div>
          <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-semibold leading-snug text-foreground">
            {course.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {course.lessons ? (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.lessons}
            </span>
          ) : null}
          {course.hours ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.hours}h
            </span>
          ) : null}
          {course.students ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {formatNumber(course.students)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {course.instructor || "TechHub"}
            </p>
            <p className="text-xs text-muted-foreground">Instructor</p>
          </div>
          <Button size="sm" className="shrink-0">
            {course.ctaLabel || "View course"}
          </Button>
        </div>
      </div>
    </Link>
  );
}
