"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Atom,
  Boxes,
  BrainCircuit,
  Code2,
  Database,
  FileCode,
  Flame,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  Palette,
  Server,
  Smartphone,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Skill } from "@/types/course";

interface SkillVisual {
  Icon: LucideIcon;
  color: string;
}

const SKILL_VISUAL_MAP: Record<string, SkillVisual> = {
  react: { Icon: Atom, color: "text-cyan-400" },
  "react.js": { Icon: Atom, color: "text-cyan-400" },
  reactjs: { Icon: Atom, color: "text-cyan-400" },
  vue: { Icon: Layers, color: "text-emerald-400" },
  "vue.js": { Icon: Layers, color: "text-emerald-400" },
  angular: { Icon: Boxes, color: "text-red-400" },
  next: { Icon: Globe, color: "text-foreground" },
  "next.js": { Icon: Globe, color: "text-foreground" },
  nextjs: { Icon: Globe, color: "text-foreground" },
  node: { Icon: Server, color: "text-emerald-400" },
  "node.js": { Icon: Server, color: "text-emerald-400" },
  nodejs: { Icon: Server, color: "text-emerald-400" },
  python: { Icon: Code2, color: "text-yellow-400" },
  django: { Icon: Code2, color: "text-emerald-400" },
  flask: { Icon: Code2, color: "text-zinc-300" },
  fastapi: { Icon: Flame, color: "text-emerald-400" },
  java: { Icon: FileCode, color: "text-orange-400" },
  spring: { Icon: Server, color: "text-emerald-400" },
  kotlin: { Icon: Smartphone, color: "text-violet-400" },
  swift: { Icon: Smartphone, color: "text-orange-400" },
  ios: { Icon: Smartphone, color: "text-zinc-300" },
  android: { Icon: Smartphone, color: "text-emerald-400" },
  flutter: { Icon: Smartphone, color: "text-sky-400" },
  "react native": { Icon: Smartphone, color: "text-cyan-400" },
  typescript: { Icon: FileCode, color: "text-sky-400" },
  javascript: { Icon: FileCode, color: "text-yellow-400" },
  go: { Icon: Terminal, color: "text-cyan-400" },
  golang: { Icon: Terminal, color: "text-cyan-400" },
  rust: { Icon: Terminal, color: "text-orange-400" },
  ai: { Icon: BrainCircuit, color: "text-rose-400" },
  ml: { Icon: BrainCircuit, color: "text-rose-400" },
  "machine learning": { Icon: BrainCircuit, color: "text-rose-400" },
  "deep learning": { Icon: BrainCircuit, color: "text-rose-400" },
  rag: { Icon: BrainCircuit, color: "text-rose-400" },
  langchain: { Icon: GitBranch, color: "text-teal-400" },
  langgraph: { Icon: GitBranch, color: "text-teal-400" },
  "data science": { Icon: Database, color: "text-violet-400" },
  sql: { Icon: Database, color: "text-sky-400" },
  postgres: { Icon: Database, color: "text-sky-400" },
  postgresql: { Icon: Database, color: "text-sky-400" },
  mysql: { Icon: Database, color: "text-sky-400" },
  mongodb: { Icon: Database, color: "text-emerald-400" },
  qdrant: { Icon: Boxes, color: "text-purple-400" },
  pinecone: { Icon: Boxes, color: "text-emerald-400" },
  weaviate: { Icon: Boxes, color: "text-sky-400" },
  git: { Icon: GitBranch, color: "text-orange-400" },
  github: { Icon: GitBranch, color: "text-foreground" },
  devops: { Icon: Server, color: "text-cyan-400" },
  docker: { Icon: Boxes, color: "text-sky-400" },
  kubernetes: { Icon: Boxes, color: "text-blue-400" },
  design: { Icon: Palette, color: "text-pink-400" },
  ui: { Icon: Palette, color: "text-pink-400" },
  ux: { Icon: Palette, color: "text-pink-400" },
};

export function getSkillVisual(
  name: string | undefined,
  category?: string | null
): SkillVisual {
  if (name) {
    const key = name.trim().toLowerCase();
    if (SKILL_VISUAL_MAP[key]) return SKILL_VISUAL_MAP[key];
    for (const [needle, visual] of Object.entries(SKILL_VISUAL_MAP)) {
      if (key.includes(needle)) return visual;
    }
  }
  if (category && CATEGORY_ICON[category]) {
    return { Icon: CATEGORY_ICON[category], color: "text-primary" };
  }
  return { Icon: GraduationCap, color: "text-primary" };
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  LANGUAGE: Code2,
  FRAMEWORK: Boxes,
  TOOL: Terminal,
};

/**
 * Theme-aware empty-state thumbnail. The base gradient + accent
 * colour live in CSS custom properties (`--placeholder-*`) so the
 * surface flips automatically between a pastel slate/indigo wash
 * (light mode) and a deep indigo/slate gradient (dark mode). Each
 * card varies the accent-glow position only, picked deterministically
 * from the title/skill so the same course always renders the same
 * variant.
 */
const ACCENT_POSITIONS: string[] = [
  "12% 18%",
  "85% 22%",
  "20% 80%",
  "78% 78%",
  "50% 30%",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getPlaceholderAccentPosition(
  title: string,
  skillName?: string | null
): string {
  const seed = `${skillName ?? ""}|${title}` || "techhub";
  const idx = hashString(seed) % ACCENT_POSITIONS.length;
  return ACCENT_POSITIONS[idx];
}

export interface CourseThumbnailProps {
  src?: string | null;
  alt: string;
  title: string;
  skills?: Skill[];
  className?: string;
  sizes?: string;
  priority?: boolean;
  ratingBadge?: React.ReactNode;
  overlay?: React.ReactNode;
  showFallbackTitle?: boolean;
}

export function CourseThumbnail({
  src,
  alt,
  title,
  skills,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority,
  overlay,
  showFallbackTitle = true,
}: CourseThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const primarySkill = skills?.[0] ?? null;
  const useImage = Boolean(src) && !errored;

  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden bg-muted",
        className
      )}
    >
      {useImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="th-hover-zoom object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="th-placeholder-surface absolute inset-0 flex items-center justify-center"
          style={
            {
              "--placeholder-accent-pos": getPlaceholderAccentPosition(
                title,
                primarySkill?.name
              ),
            } as React.CSSProperties
          }
        >
          {/* Faint dot texture so the surface never reads as flat.
              Colour comes from the theme so it works light + dark. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(var(--placeholder-texture) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          {/* Brand mark watermark — opacity controlled by theme token */}
          <Image
            src="/brand-mark.png"
            alt=""
            width={220}
            height={220}
            className="pointer-events-none absolute -right-8 -bottom-8 h-44 w-44"
            style={{ opacity: "var(--placeholder-watermark)" }}
          />
          <div className="relative flex flex-col items-center gap-2 px-6 text-center">
            <div className="th-placeholder-chip flex h-12 w-12 items-center justify-center rounded-2xl">
              <Image
                src="/brand-mark.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            {showFallbackTitle ? (
              <p className="line-clamp-2 max-w-[18ch] text-sm font-semibold">
                {primarySkill?.name || title}
              </p>
            ) : null}
            <div className="th-placeholder-muted inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <Sparkles className="h-3 w-3" />
              TechHub
            </div>
          </div>
        </div>
      )}
      {overlay}
    </div>
  );
}

export function CourseThumbnailFallback({
  title,
  skills,
  className,
}: {
  title: string;
  skills?: Skill[];
  className?: string;
}) {
  return (
    <CourseThumbnail
      src={null}
      alt={title}
      title={title}
      skills={skills}
      className={className}
    />
  );
}

export { Flame as TrendingIcon };
