"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("AboutPage");

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[400px] md:min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/aboutUs/thumbnail2.png" // TODO: Thêm URL ảnh background vào đây
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center px-4 text-center md:min-h-[500px]">
          <h1 className="mb-4 text-3xl font-bold italic text-white md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="text-base text-white/90 md:text-lg max-w-3xl">
            {t("heroDescription")}
          </p>
        </div>
      </section>

      {/* Our Goal Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="mb-2 font-semibold text-primary">{t("ourGoal")}</p>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              {t("achieveGoals")}
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              {t("goalDescription")}
            </p>
          </div>

          {/* Image Grid - 3 placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Image Placeholder 1 */}
            <div className="group relative h-80 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-all hover:border-primary">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (1).png"
                alt="About TechHub 1"
                fill
                className="object-cover"
              />
            </div>

            {/* Image Placeholder 2 */}
            <div className="group relative h-80 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-all hover:border-primary">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (2).png"
                alt="About TechHub 2"
                fill
                className="object-cover"
              />
            </div>

            {/* Image Placeholder 3 */}
            <div className="group relative h-80 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-all hover:border-primary">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (3).png"
                alt="About TechHub 3"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                {t("ourMission")}
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                {t("missionDescription")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-foreground/85">
                    {t("mission1")}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-foreground/85">
                    {t("mission2")}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-foreground/85">
                    {t("mission3")}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-foreground/85">
                    {t("mission4")}
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden">
              {/* Add your mission image URL here */}
              <Image
                src="/contact/Mask group (4).png"
                alt="Our Mission"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                10K+
              </div>
              <div className="text-muted-foreground">{t("activeStudents")}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[hsl(var(--learning-accent))] md:text-5xl">
                500+
              </div>
              <div className="text-muted-foreground">{t("courses")}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[hsl(var(--warning))] md:text-5xl">
                100+
              </div>
              <div className="text-muted-foreground">{t("expertInstructors")}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-accent-foreground md:text-5xl">
                95%
              </div>
              <div className="text-muted-foreground">{t("successRate")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/aboutUs/cta-background.jpg"
            alt="CTA Background"
            fill
            className="object-cover"
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t("ctaTitle")}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <Link href="/login">
            <Button size="lg">
              {t("getStarted")}
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
