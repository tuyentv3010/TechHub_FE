import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MonitorPlay } from "lucide-react";

import { AppSurface, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";

interface SkillsSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  yearsText?: string;
  experienceText?: string;
  feature1Title?: string;
  feature1Description?: string;
  feature2Title?: string;
  feature2Description?: string;
}

export function SkillsSection({
  title = "Advance your skills with TechHub",
  subtitle = "About TechHub",
  description = "TechHub helps learners and teams build practical technology skills through structured courses, hands-on content, and instructor guidance.",
  buttonText = "Learn more",
  yearsText = "5+",
  experienceText = "Years of learning delivery",
  feature1Title = "Expert-led courses",
  feature1Description = "Learn from instructors with practical industry experience and a clear path from concept to real work.",
  feature2Title = "Flexible learning",
  feature2Description = "Access courses across devices, learn at your own pace, and keep progress visible throughout the journey.",
}: SkillsSectionProps) {
  const features = [
    {
      title: feature1Title,
      description: feature1Description,
      icon: BadgeCheck,
    },
    {
      title: feature2Title,
      description: feature2Description,
      icon: MonitorPlay,
    },
  ];

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-card">
                <Image
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
                  alt="TechHub instructor"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-card">
                <Image
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
                  alt="TechHub workspace"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative col-span-2 h-56 overflow-hidden rounded-xl border border-border bg-card">
                <Image
                  src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80"
                  alt="TechHub learning team"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <AppSurface className="absolute left-1/2 top-1/2 min-w-[150px] -translate-x-1/2 -translate-y-1/2 text-center shadow-md">
              <div className="text-3xl font-semibold text-primary">{yearsText}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {experienceText}
              </div>
            </AppSurface>
          </div>

          <div className="space-y-8">
            <PageHeader eyebrow={subtitle} title={title} description={description} />

            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <AppSurface key={feature.title} padding="md">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </AppSurface>
                );
              })}
            </div>

            <Button asChild size="lg">
              <Link href="/about">
                {buttonText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
