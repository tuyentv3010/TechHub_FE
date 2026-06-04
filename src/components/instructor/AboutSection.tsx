"use client";

import { Sparkles, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toStringArray, type InstructorProfile } from "@/types/instructor";

/**
 * "Giới thiệu" + skills + languages. Renders nothing if all three are empty
 * (so we never show an empty box).
 */
export function AboutSection({ profile }: { profile: InstructorProfile }) {
  const t = useTranslations("instructor");
  const skills = toStringArray(profile.skills);
  const languages = toStringArray(profile.languages);
  const hasSummary = Boolean(profile.cvSummary);

  if (!hasSummary && skills.length === 0 && languages.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 pt-11 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-12">
        <div>
          {hasSummary && (
            <>
              <h2 className="mb-3.5 font-display text-[1.4rem] font-bold text-foreground">{t("about.title")}</h2>
              <p className="max-w-[64ch] text-[1.05rem] leading-[1.72] text-foreground/85 [text-wrap:pretty]">
                {profile.cvSummary}
              </p>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {skills.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-[15px] text-primary" />
                {t("skills")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/10 font-medium text-primary"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                <Languages className="size-[15px] text-primary" />
                {t("languages")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <Badge key={l} variant="secondary" className="rounded-full font-normal text-muted-foreground">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <Separator className="mt-9" />
    </>
  );
}
