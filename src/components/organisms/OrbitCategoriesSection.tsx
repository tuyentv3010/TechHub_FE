"use client";

import { useGetSkills } from "@/queries/useCourse";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface Skill {
  id: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
}

interface OrbitCategoriesSectionProps {
  title?: string;
}

// Single skill icon component with hover tooltip
function SkillIcon({ skill }: { skill: Skill }) {
  return (
    <Link href={`/skills/${skill.id}`} className="block">
      <div className="relative group cursor-pointer">
        {/* Skill Icon Circle */}
        <div className="w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 hover:scale-110 transition-all duration-300">
          {skill.thumbnail ? (
            <Image
              src={skill.thumbnail}
              alt={skill.name}
              width={64}
              height={64}
              className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 object-contain"
            />
          ) : (
            <span className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {skill.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Tooltip on hover */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
          <div className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg">
            {skill.name}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Rotating Arc with skills
function RotatingArc({
  radius,
  skills,
  color,
  duration,
  reverse = false,
  centerX,
  centerY,
}: {
  radius: number;
  skills: Skill[];
  color: string;
  duration: number;
  reverse?: boolean;
  centerX: number;
  centerY: number;
}) {
  // Full 360° circle - distribute skills evenly
  const initialAngles = skills.map((skill, index) => {
    // Start from top (-90°) and go clockwise
    const angle = -90 + (360 / skills.length) * index;
    return { skill, initialAngle: angle };
  });

  return (
    <>
      {/* Full circle - static, centered */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8 4"
        opacity={0.4}
        className="pointer-events-none"
      />

      {/* Rotating container - centered at the same point */}
      <motion.g
        style={{
          transformOrigin: `${centerX}px ${centerY}px`,
        }}
        animate={{
          rotate: reverse ? -360 : 360,
        }}
        transition={{
          rotate: {
            duration: duration,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {/* Skills positioned relative to center */}
        {initialAngles.map(({ skill, initialAngle }) => {
          const angleRad = (initialAngle * Math.PI) / 180;
          const x = centerX + Math.cos(angleRad) * radius;
          const y = centerY + Math.sin(angleRad) * radius;
          
          return (
            <foreignObject
              key={skill.id}
              x={x - 36}
              y={y - 36}
              width={72}
              height={72}
              style={{ overflow: 'visible' }}
            >
              <motion.div
                className="w-full h-full flex items-center justify-center"
                animate={{
                  rotate: reverse ? 360 : -360,
                }}
                transition={{
                  rotate: {
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              >
                <SkillIcon skill={skill} />
              </motion.div>
            </foreignObject>
          );
        })}
      </motion.g>
    </>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-16 animate-pulse" />
        <div className="relative h-[500px]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
            {[280, 400, 520].map((radius, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 border-gray-200 dark:border-gray-700"
                style={{
                  width: radius * 2,
                  height: radius * 2,
                  bottom: -radius,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Mobile Grid View
function MobileGrid({ skills, title }: { skills: Skill[]; title?: string }) {
  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        <div className="grid grid-cols-4 gap-3">
          {skills.slice(0, 16).map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                href={`/skills/${skill.id}`}
                className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  {skill.thumbnail ? (
                    <Image
                      src={skill.thumbnail}
                      alt={skill.name}
                      width={48}
                      height={48}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {skill.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="mt-2 text-[10px] font-medium text-center text-gray-600 dark:text-gray-400 line-clamp-1">
                  {skill.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Main Component
export function OrbitCategoriesSection({ title }: OrbitCategoriesSectionProps) {
  const { data: skillsData, isLoading } = useGetSkills();
  const skills = ((skillsData?.payload?.data ?? []) as Skill[]).slice(0, 16);

  // Distribute skills across arcs
  const { arc1Skills, arc2Skills, arc3Skills } = useMemo(() => {
    if (skills.length === 0) return { arc1Skills: [], arc2Skills: [], arc3Skills: [] };

    const total = skills.length;
    
    if (total <= 5) {
      return {
        arc1Skills: skills,
        arc2Skills: [],
        arc3Skills: [],
      };
    } else if (total <= 10) {
      const innerCount = Math.ceil(total * 0.4);
      return {
        arc1Skills: skills.slice(0, innerCount),
        arc2Skills: skills.slice(innerCount),
        arc3Skills: [],
      };
    } else {
      const innerCount = Math.min(5, Math.ceil(total * 0.25));
      const middleCount = Math.min(7, Math.ceil(total * 0.35));
      const outerCount = total - innerCount - middleCount;
      
      return {
        arc1Skills: skills.slice(0, innerCount),
        arc2Skills: skills.slice(innerCount, innerCount + middleCount),
        arc3Skills: skills.slice(innerCount + middleCount, innerCount + middleCount + Math.min(9, outerCount)),
      };
    }
  }, [skills]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (skills.length === 0) {
    return null;
  }

  // Container dimensions - center at bottom to show top 1/4 of circles
  const containerHeight = 450;
  const containerWidth = 1200;
  const centerX = containerWidth / 2;
  const centerY = containerHeight + 150; // Push center below visible area to show top portion

  // Arc configurations - larger circles
  const arcConfigs = [
    { radius: 280, color: "#22d3ee", skills: arc1Skills, duration: 25, reverse: false },
    { radius: 450, color: "#a855f7", skills: arc2Skills, duration: 35, reverse: true },
    { radius: 580, color: "#3b82f6", skills: arc3Skills, duration: 45, reverse: false },
  ].filter(arc => arc.skills.length > 0);

  return (
    <>
      {/* Desktop/Tablet View */}
      <section className="hidden md:block py-8 lg:py-12 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900 overflow-hidden">
        <div className="container mx-auto px-4">
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white"
            >
              {title}
            </motion.h2>
          )}

          {/* Arc Container */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto overflow-hidden"
            style={{ 
              height: containerHeight,
              maxWidth: containerWidth,
            }}
          >
            {/* Background grid */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-900 dark:bg-white" />
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 h-px bg-gray-900 dark:bg-white"
                  style={{ top: `${i * 12.5}%` }}
                />
              ))}
            </div>

            {/* All orbits in a single SVG - ensures same center */}
            <svg 
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox={`0 0 ${containerWidth} ${containerHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {arcConfigs.map((arc, index) => (
                <RotatingArc
                  key={index}
                  radius={arc.radius}
                  skills={arc.skills}
                  color={arc.color}
                  duration={arc.duration}
                  reverse={arc.reverse}
                  centerX={centerX}
                  centerY={centerY}
                />
              ))}
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Mobile Grid View */}
      <div className="md:hidden">
        <MobileGrid skills={skills} title={title} />
      </div>
    </>
  );
}

export default OrbitCategoriesSection;
