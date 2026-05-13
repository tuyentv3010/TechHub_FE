"use client";

import { useGetCourseList, useGetSkills } from "@/queries/useCourse";
import { normalizePersistedMediaUrl } from "@/lib/file-media";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Skill {
  id: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
  href?: string;
}

interface CourseLike {
  skills?: Array<Partial<Skill> | string> | null;
  categories?: string[] | null;
}

interface OrbitCategoriesSectionProps {
  title?: string;
}

const MAX_VISIBLE_CATEGORIES = 6;

function buildCoursesUrl(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `/courses?${searchParams.toString()}`;
}

function normalizeSkillItem(item: Partial<Skill> | string): Skill | null {
  if (typeof item === "string") {
    const name = item.trim();
    if (!name) return null;

    return {
      id: name,
      name,
      thumbnail: null,
      category: null,
      href: buildCoursesUrl({ search: name }),
    };
  }

  const name = item.name?.trim();
  if (!name) return null;

  const id = item.id?.trim() || name;

  return {
    id,
    name,
    thumbnail: item.thumbnail ?? null,
    category: item.category ?? null,
    href: item.id
      ? buildCoursesUrl({ skillIds: id })
      : buildCoursesUrl({ search: name }),
  };
}

function buildFallbackSkillsFromCourses(courses: CourseLike[]) {
  const skillMap = new Map<string, Skill>();

  courses.forEach((course) => {
    const sourceItems =
      course.skills && course.skills.length > 0
        ? course.skills
        : course.categories ?? [];

    sourceItems.forEach((item) => {
      const skill = normalizeSkillItem(item);
      if (!skill) return;

      const key = `${skill.id}-${skill.name}`.toLowerCase();
      if (!skillMap.has(key)) {
        skillMap.set(key, skill);
      }
    });
  });

  return Array.from(skillMap.values());
}

function buildOrbitItems(skills: Skill[]) {
  return skills.map((skill, index) => ({
    skill,
    orbitKey: `${skill.id}-${skill.name}-${index}`,
  }));
}

function SkillIcon({ skill, compact = false }: { skill: Skill; compact?: boolean }) {
  const thumbnailUrl = normalizePersistedMediaUrl(skill.thumbnail);

  return (
    <Link href={skill.href ?? buildCoursesUrl({ skillIds: skill.id })} className="block">
      <div
        className={
          compact
            ? "group flex h-16 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-border bg-card px-2 py-2 text-center shadow-sm transition-colors hover:border-primary/40"
            : "group flex h-[78px] w-[142px] cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-center shadow-sm transition-colors hover:border-primary/40"
        }
      >
        {thumbnailUrl ? (
          <div
            className={
              compact
                ? "mb-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary"
                : "mb-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary"
            }
          >
            <Image
              src={thumbnailUrl}
              alt={skill.name}
              width={32}
              height={32}
              className={compact ? "h-5 w-5 object-contain" : "h-6 w-6 object-contain"}
            />
          </div>
        ) : null}
        <span
          className={
            compact
              ? "line-clamp-2 max-w-full text-[10px] font-semibold leading-tight text-foreground"
              : "line-clamp-2 max-w-full text-xs font-semibold leading-tight text-foreground"
          }
        >
          {skill.name}
        </span>
      </div>
    </Link>
  );
}

function RotatingSemiCircle({
  radius,
  skills,
  duration,
  centerX,
  centerY,
  containerWidth,
  containerHeight,
  itemWidth = 142,
  itemHeight = 78,
  compact = false,
}: {
  radius: number;
  skills: Skill[];
  duration: number;
  centerX: number;
  centerY: number;
  containerWidth: number;
  containerHeight: number;
  itemWidth?: number;
  itemHeight?: number;
  compact?: boolean;
}) {
  const orbitItems = buildOrbitItems(skills);
  const animationKey = orbitItems
    .map(({ skill }) => `${skill.id}:${skill.name}`)
    .join("|");

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border-2 border-dashed border-primary/35"
        style={{
          left: `${((centerX - radius) / containerWidth) * 100}%`,
          top: `${((centerY - radius) / containerHeight) * 100}%`,
          width: `${((radius * 2) / containerWidth) * 100}%`,
          height: `${((radius * 2) / containerHeight) * 100}%`,
        }}
      />

      <div
        key={animationKey}
        className="orbit-categories-spin absolute inset-0"
        style={{
          transformOrigin: `${(centerX / containerWidth) * 100}% ${(centerY / containerHeight) * 100}%`,
          animationDuration: `${duration}s`,
        }}
      >
        {orbitItems.map(({ skill, orbitKey }, index) => {
          const initialAngle = -180 + (360 / orbitItems.length) * index;
          const angleRad = (initialAngle * Math.PI) / 180;
          const x = centerX + Math.cos(angleRad) * radius;
          const y = centerY + Math.sin(angleRad) * radius;

          return (
            <div
              key={orbitKey}
              className="absolute flex items-center justify-center"
              style={{
                left: `${(x / containerWidth) * 100}%`,
                top: `${(y / containerHeight) * 100}%`,
                width: itemWidth,
                height: itemHeight,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="orbit-categories-counter-spin flex h-full w-full items-center justify-center"
                style={{
                  animationDuration: `${duration}s`,
                }}
              >
                <SkillIcon skill={skill} compact={compact} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <section className="overflow-hidden bg-background py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 h-10 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="relative mx-auto h-[420px] max-w-[1120px] overflow-hidden">
          <div className="absolute bottom-[-36px] left-1/2 h-[780px] w-[780px] -translate-x-1/2 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700" />
        </div>
      </div>
    </section>
  );
}

function MobileOrbit({ skills, title }: { skills: Skill[]; title?: string }) {
  const containerWidth = 390;
  const containerHeight = 310;
  const centerX = containerWidth / 2;
  const centerY = containerHeight - 10;
  const radius = 215;

  return (
    <section className="overflow-hidden bg-background py-10">
      <div className="container mx-auto px-4">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 text-center text-2xl font-bold text-gray-900 dark:text-white"
          >
            {title}
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative mx-auto w-full max-w-[390px] overflow-hidden"
          style={{
            aspectRatio: `${containerWidth} / ${containerHeight}`,
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
          <RotatingSemiCircle
            radius={radius}
            skills={skills}
            duration={28}
            centerX={centerX}
            centerY={centerY}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            itemWidth={112}
            itemHeight={64}
            compact
          />
        </motion.div>
      </div>
    </section>
  );
}

export function OrbitCategoriesSection({ title }: OrbitCategoriesSectionProps) {
  const { data: skillsData, isLoading: isSkillsLoading } = useGetSkills({
    redirectOnUnauthorized: false,
    suppressErrorLog: true,
    retry: false,
  });
  const { data: coursesData, isLoading: isCoursesLoading } = useGetCourseList({
    page: 0,
    size: 50,
    status: "PUBLISHED",
    redirectOnUnauthorized: false,
    suppressErrorLog: true,
    retry: false,
  });

  const apiSkills = ((skillsData?.payload?.data ?? []) as Partial<Skill>[])
    .map((skill) => normalizeSkillItem(skill))
    .filter((skill): skill is Skill => Boolean(skill));
  const fallbackSkills = buildFallbackSkillsFromCourses(
    (coursesData?.payload?.data ?? []) as CourseLike[]
  );
  const sourceSkills =
    apiSkills.length > 0
      ? apiSkills
      : fallbackSkills.length > 0
        ? fallbackSkills
        : [];
  const skills = sourceSkills.slice(0, MAX_VISIBLE_CATEGORIES);
  const isLoading =
    skills.length === 0 &&
    (isSkillsLoading || (apiSkills.length === 0 && isCoursesLoading));

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (skills.length === 0) {
    return null;
  }

  const containerHeight = 500;
  const containerWidth = 1180;
  const centerX = containerWidth / 2;
  const centerY = containerHeight - 36;
  const radius = 420;

  return (
    <>
      <section className="hidden overflow-hidden bg-background py-10 md:block lg:py-14">
        <div className="container mx-auto px-4">
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-5xl"
            >
              {title}
            </motion.h2>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full overflow-hidden"
            style={{
              aspectRatio: `${containerWidth} / ${containerHeight}`,
              maxWidth: containerWidth,
            }}
          >
            <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

            <RotatingSemiCircle
              radius={radius}
              skills={skills}
              duration={34}
              centerX={centerX}
              centerY={centerY}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
            />
          </motion.div>
        </div>
      </section>

      <div className="md:hidden">
        <MobileOrbit skills={skills} title={title} />
      </div>
    </>
  );
}

export default OrbitCategoriesSection;
