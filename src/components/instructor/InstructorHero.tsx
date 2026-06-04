"use client";

import type { ComponentType } from "react";
import { MapPin, Briefcase, AtSign, Sparkles, Linkedin, Github, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { InstructorAccount, InstructorProfile } from "@/types/instructor";

export interface HeroStat {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

const SOCIALS = [
  { key: "linkedinUrl", icon: Linkedin, label: "LinkedIn" },
  { key: "githubUrl", icon: Github, label: "GitHub" },
  { key: "portfolioUrl", icon: Globe, label: "Portfolio" },
] as const;

export function InstructorHero({
  account,
  profile,
  stats,
  coverImageUrl,
}: {
  account: InstructorAccount;
  profile: InstructorProfile;
  stats: HeroStat[];
  coverImageUrl?: string;
}) {
  const t = useTranslations("instructor");
  const name = profile.fullName || account.username;
  const socials = SOCIALS.map((s) => ({ ...s, url: profile[s.key] })).filter((s) => Boolean(s.url));

  return (
    <section aria-labelledby="instructor-name">
      {/* Cover band — brand gradient built from the theme primary */}
      <div
        className="relative h-[184px] overflow-hidden bg-gradient-to-br from-primary to-primary/70 bg-cover bg-center"
        style={coverImageUrl ? { backgroundImage: `url("${coverImageUrl}")` } : undefined}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-black/20" />
      </div>

      <div className="mx-auto flex max-w-[var(--content-max,1180px)] flex-wrap items-start justify-between gap-10 px-6 pt-[22px]">
        <div className="flex flex-col items-start gap-3.5 sm:flex-row sm:items-start sm:gap-6">
          <Avatar className="-mt-[104px] size-[140px] flex-none text-4xl font-extrabold ring-[5px] ring-background shadow-lg max-sm:-mt-16">
            <AvatarImage src={account.avatarUrl} alt={t("avatarAlt", { name })} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 font-display text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.09em] text-primary">
              <Sparkles className="size-3.5" />
              {t("eyebrow")}
            </span>
            <h1 id="instructor-name" className="font-display text-[clamp(1.875rem,4vw,2.875rem)] font-extrabold leading-[1.05] text-foreground">
              {name}
            </h1>

            <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] text-muted-foreground">
              {profile.cvLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary/85" />
                  {profile.cvLocation}
                </span>
              )}
              {profile.yearsOfExperience != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-4 text-primary/85" />
                  {t("yearsExperience", { years: profile.yearsOfExperience })}
                </span>
              )}
              {account.username && (
                <span className="inline-flex items-center gap-1.5">
                  <AtSign className="size-4 text-primary/85" />
                  {account.username}
                </span>
              )}
            </div>

            {socials.length > 0 && (
              <div className="mt-4 flex gap-2.5">
                {socials.map(({ key, icon: Icon, label, url }) => (
                  <Button
                    key={key}
                    asChild
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-[10px] transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  >
                    <a href={url as string} target="_blank" rel="noreferrer noopener" aria-label={label}>
                      <Icon className="size-[18px]" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-1.5" role="group" aria-label={t("statsAria")}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="grid min-w-[104px] grid-cols-[auto_1fr] items-center gap-x-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm"
                >
                  <span className="row-span-2 grid size-9 place-items-center rounded-[10px] bg-primary/12 text-primary">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="font-display text-xl font-extrabold leading-none text-foreground">{s.value}</span>
                  <span className="mt-0.5 text-[0.8rem] text-muted-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
