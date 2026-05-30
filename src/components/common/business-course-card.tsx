"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn, formatNumber } from "@/lib/utils";
import { CourseThumbnail, getSkillVisual } from "@/components/common/course-thumbnail";
import type { Skill } from "@/types/course";

export interface BusinessCourseCardData {
  href: string;
  title: string;
  description?: string;
  image: string | null;
  instructor?: string;
  instructorAvatar?: string;
  instructorVerified?: boolean;
  rating?: number;
  reviews?: number;
  priceLabel?: string;
  originalPriceLabel?: string | null;
  discountPercent?: number;
  currencyLabel?: string;
  badge?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  language?: "VI" | "EN" | "JA" | string;
  lessons?: number;
  hours?: number;
  students?: number;
  ctaLabel?: string;
  skills?: Skill[];
  isBestseller?: boolean;
  isNew?: boolean;
  isFree?: boolean;
  isEnrolled?: boolean;
  promoEndDate?: string | null;
}

export interface BusinessCourseCardProps {
  course: BusinessCourseCardData;
  className?: string;
  priorityImage?: boolean;
  variant?: "default" | "showcase";
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

const LANGUAGE_LABEL: Record<string, string> = {
  VI: "vietnamese",
  EN: "english",
  JA: "japanese",
};

function formatMetadataValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPromoDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() < Date.now()) return null;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function BusinessCourseCard({
  course,
  className,
  priorityImage,
  variant = "default",
}: BusinessCourseCardProps) {
  const t = useTranslations("courses");
  const [avatarErrored, setAvatarErrored] = useState(false);
  const rating = course.rating ?? 0;
  const hasRating = rating > 0 || (course.reviews ?? 0) > 0;
  const levelKey = course.level ?? "";
  const levelLabel = levelKey
    ? LEVEL_LABEL[levelKey]
      ? t(LEVEL_LABEL[levelKey])
      : course.badge || formatMetadataValue(levelKey)
    : "";
  const languageLabel = course.language
    ? LANGUAGE_LABEL[course.language]
      ? t(LANGUAGE_LABEL[course.language])
      : formatMetadataValue(course.language)
    : null;
  const promoLabel = formatPromoDate(course.promoEndDate);
  const skills = course.skills ?? [];
  const visibleSkills = skills.slice(0, 4);
  const extraSkills = Math.max(0, skills.length - visibleSkills.length);
  const avatarSrc = course.instructorAvatar && !avatarErrored ? course.instructorAvatar : null;

  const showStudents = (course.students ?? 0) > 0;
  const showReviewBlock = hasRating;
  const isShowcase = variant === "showcase";

  const priceCaption = course.isFree
    ? t("freeLearning")
    : course.originalPriceLabel
      ? `${t("discountedPrice")}${course.currencyLabel ? ` • ${course.currencyLabel}` : ""}`
      : `${t("tuitionFee")}${course.currencyLabel ? ` • ${course.currencyLabel}` : ""}`;

  return (
    <Link
      href={course.href}
      className={cn(
        "group th-hover-lift th-focus-ring th-card-elevated relative flex h-full flex-col overflow-hidden rounded-2xl text-card-foreground",
        isShowcase
          ? "p-2.5 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--secondary)/0.6)_100%)]"
          : "p-3",
        "focus-visible:outline-none",
        className
      )}
    >
      <CourseThumbnail
        src={course.image}
        alt={course.title}
        title={course.title}
        skills={course.skills}
        priority={priorityImage}
        showFallbackTitle={false}
        className={cn(
          "rounded-xl",
          isShowcase ? "aspect-[1.7/1]" : "aspect-video"
        )}
        overlay={
          <>
            {/* Status badges — all monochrome dark-glass; only the
                two truly semantic states (enrolled / discount) keep
                a coloured ring so they still read at a glance. */}
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              {course.isBestseller ? (
                <span className="th-glass-badge">
                  <Star className="h-3 w-3" />
                  {t("bestseller")}
                </span>
              ) : null}
              {course.isFree ? (
                <span className="th-glass-badge">{t("free")}</span>
              ) : null}
              {course.isNew ? (
                <span className="th-glass-badge">{t("new")}</span>
              ) : null}
            </div>

            <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
              {course.isEnrolled ? (
                <span className="th-glass-badge" data-tone="emerald">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("enrolled")}
                </span>
              ) : course.discountPercent && course.discountPercent > 0 ? (
                <span className="th-glass-badge" data-tone="rose">
                  -{course.discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="th-reveal-on-hover pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </>
        }
      />

      <div
        className={cn(
          "flex flex-1 flex-col px-2 pb-2 pt-5",
          isShowcase ? "gap-3.5 sm:px-3 sm:pb-3 sm:pt-4" : "gap-4"
        )}
      >
        <div className="space-y-2">
          {(levelLabel || languageLabel) ? (
            <div className="flex flex-wrap items-center">
              {levelLabel ? (
                <span className="th-meta-pill">
                  <GraduationCap className="h-3 w-3 opacity-70" />
                  {levelLabel}
                </span>
              ) : null}
              {languageLabel ? (
                <span className="th-meta-pill">{languageLabel}</span>
              ) : null}
            </div>
          ) : null}
          <h3 className="th-hover-title line-clamp-2 text-[1.0625rem] font-bold leading-snug text-foreground tracking-tight">
            {course.title}
          </h3>
          {course.description ? (
            <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>

        {visibleSkills.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {visibleSkills.map((skill) => {
              const { Icon, color } = getSkillVisual(skill.name, skill.category);
              return (
                <span
                  key={skill.id || skill.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-border/50"
                >
                  <Icon className={cn("h-3.5 w-3.5", color)} strokeWidth={2.2} />
                  {skill.name}
                </span>
              );
            })}
            {extraSkills > 0 ? (
              <span className="inline-flex items-center rounded-full bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/50">
                +{extraSkills}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Compact meta row — kept subdued so the title + price stay
            the visual anchors of the card. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground">
          {showReviewBlock ? (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {(course.reviews ?? 0) > 0 ? (
                <span className="text-muted-foreground font-normal">
                  ({formatNumber(course.reviews!)})
                </span>
              ) : null}
            </span>
          ) : null}
          {(course.lessons ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {t("lessonsCount", { count: course.lessons })}
            </span>
          ) : null}
          {(course.hours ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("hoursCount", { count: course.hours })}
            </span>
          ) : null}
          {showStudents ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(course.students!)}
            </span>
          ) : null}
        </div>

        {/* Purchase block — separated from course content by a thin
            divider; price uses warm amber tone for emphasis. */}
        <div className="th-divider mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="th-price text-[1.625rem] leading-none">
                {course.priceLabel || "—"}
              </span>
              {course.originalPriceLabel ? (
                <span className="text-xs text-muted-foreground line-through">
                  {course.originalPriceLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {priceCaption}
            </p>
          </div>
          {promoLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/25">
              <Clock className="h-3 w-3" />
              {t("discountUntil", { date: promoLabel })}
            </span>
          ) : null}
        </div>

        {/* Instructor strip — also separated by a divider so the
            person owning the course reads as a distinct band. */}
        <div className="th-divider flex items-center justify-between gap-3 pt-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={course.instructor || "Instructor"}
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-background"
                onError={() => setAvatarErrored(true)}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-xs font-semibold uppercase text-primary ring-2 ring-background">
                {(course.instructor || "T").charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {course.instructor || "TechHub"}
              </p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {t("instructor")}
                {course.instructorVerified ? (
                  <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <span
          className={cn(
            "th-interactive-color mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold",
            course.isEnrolled
              ? "bg-secondary text-secondary-foreground group-hover:bg-secondary/80"
              : "bg-primary text-primary-foreground group-hover:bg-primary/90"
          )}
        >
          {course.ctaLabel || (course.isEnrolled ? t("enterToLearn") : t("viewDetails"))}
          <ArrowRight className="th-hover-arrow h-4 w-4" />
        </span>
      </div>

      {/* Soft brand-tinted glow only on hover — kept very low opacity
          so it doesn't add chroma noise to the resting card. */}
      <span className="th-reveal-on-hover pointer-events-none absolute inset-x-10 -bottom-10 h-20 rounded-full bg-primary/15 blur-3xl" />
      <span aria-hidden className="hidden">
        <Sparkles />
      </span>
    </Link>
  );
}
