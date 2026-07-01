"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ProfileTab {
  id: string;
  label: string;
  count?: number;
}

/**
 * Sticky section nav with scroll-spy. Each tab id must match a section
 * element id rendered by the page. Clicking smooth-scrolls to it.
 */
export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    if (tabs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tabs]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (tabs.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Mục hồ sơ"
      className="sticky top-[var(--nav-height,68px)] z-30 -mx-6 border-b border-border bg-background/90 px-6 backdrop-blur"
    >
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => jump(t.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-[2.5px] border-transparent px-3.5 py-4 text-[0.95rem] font-semibold transition-colors",
                isActive ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count != null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-xs font-bold",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
