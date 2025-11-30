"use client";

import { useGetSkills } from "@/queries/useCourse";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

interface Skill {
  id: string;
  name: string;
  thumbnail: string | null;

  category: string | null;
}

interface OrbitCategoriesSectionProps {
  title?: string;
}

// Arc with rotating skills - large arc visible
function RotatingArc({
  radius,
  skills,
  color,
  duration,
  reverse = false,
  centerY,
}: {
  radius: number;
  skills: Skill[];
  color: string;
  duration: number;
  reverse?: boolean;
  centerY: number;
}) {
  // Distribute skills evenly around the full circle for smooth rotation
  const skillAngles = skills.map((skill, index) => {
    const angleStep = 360 / skills.length;
    const angle = angleStep * index - 90; // Start from top (-90 degrees)
    return { skill, angle };
  });

  // Arc path for SVG - draw arc from -200° to 20° (220° arc)
  const startAngle = -200 * (Math.PI / 180); // Left side
  const endAngle = 20 * (Math.PI / 180);     // Right side
  
  // SVG center is at (radius, centerY) within the SVG viewport
  const cx = radius;
  const cy = centerY;
  const startX = cx + Math.cos(startAngle) * radius;
  const startY = cy + Math.sin(startAngle) * radius;
  const endX = cx + Math.cos(endAngle) * radius;
  const endY = cy + Math.sin(endAngle) * radius;

  return (
    <div 
      className="absolute"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: radius * 2,
        height: centerY + radius,
        top: 0,
      }}
    >
      {/* Arc Path SVG */}
      <svg
        className="absolute inset-0 overflow-visible pointer-events-none"
        width={radius * 2}
        height={centerY + radius}
      >
        <defs>
          <linearGradient id={`arc-gradient-${radius}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`}
          fill="none"
          stroke={`url(#arc-gradient-${radius})`}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>

      {/* Rotating container for skills - centered at (cx, cy) */}
      <motion.div
        className="absolute"
        style={{
          left: cx,
          top: cy,
          width: 0,
          height: 0,
        }}
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
        {skillAngles.map(({ skill, angle }) => {
          // Calculate position on circle relative to center (0,0)
          const angleRad = (angle * Math.PI) / 180;
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;
          
          return (
            <RotatingSkillIcon
              key={skill.id}
              skill={skill}
              x={x}
              y={y}
              duration={duration}
              reverse={reverse}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

// Skill Icon that rotates with the arc
function RotatingSkillIcon({
  skill,
  x,
  y,
  duration,
  reverse,
}: {
  skill: Skill;
  x: number;
  y: number;
  duration: number;
  reverse: boolean;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
      // Counter-rotate to keep icons upright
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
      <Link href={`/skills/${skill.id}`}>
        <motion.div
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Skill Icon */}
          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300">
            {skill.thumbnail ? (
              <Image
                src={skill.thumbnail}
                alt={skill.name}
                width={64}
                height={64}
                className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 object-contain"
              />
            ) : (
              <span className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">
                {skill.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg">
              {skill.name}
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-16 animate-pulse" />
        <div className="relative h-[400px] md:h-[450px] lg:h-[500px]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
            {[180, 280, 380].map((radius, i) => (
              <div
                key={i}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full border-2 border-gray-200 dark:border-gray-700"
                style={{
                  width: radius * 2,
                  height: radius,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Mobile Grid Fallback
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
  const skills = (skillsData?.payload?.data ?? []) as Skill[];

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
      // 3 arcs for 11+ skills
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

  // Arc configurations - larger radii, center at bottom of container
  const containerHeight = 500; // Height of visible area
  const centerY = containerHeight + 80; // Center point below container (to show large arc)
  const centerX = 0; // Will be set to 50% via CSS
  
  const arcConfigs = [
    { radius: 280, color: "#22d3ee", skills: arc1Skills, duration: 20, reverse: false }, // cyan - inner
    { radius: 400, color: "#a855f7", skills: arc2Skills, duration: 28, reverse: true },  // purple - middle
    { radius: 520, color: "#3b82f6", skills: arc3Skills, duration: 36, reverse: false }, // blue - outer
  ].filter(arc => arc.skills.length > 0);

  return (
    <>
      {/* Desktop/Tablet View */}
      <section 
        className="hidden md:block py-8 lg:py-12 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900 overflow-hidden"
      >
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
            className="relative overflow-hidden"
            style={{ height: containerHeight }}
          >
            {/* Background grid lines */}
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

            {/* Rotating Arcs with Skills */}
            <div 
              className="absolute inset-0"
            >
              {arcConfigs.map((arc, index) => (
                <RotatingArc
                  key={index}
                  radius={arc.radius}
                  skills={arc.skills}
                  color={arc.color}
                  duration={arc.duration}
                  reverse={arc.reverse}
                  centerY={centerY}
                />
              ))}
            </div>
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
