import Image from "next/image";
import { Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { MetricCard, PageHeader } from "@/components/common";

interface CommunityStats {
  totalStudents: string;
  totalCourses: string;
  totalInstructors: string;
  successRate: string;
}

interface CommunitySectionProps {
  title: string;
  stats: CommunityStats;
}

export function CommunitySection({ title, stats }: CommunitySectionProps) {
  const metricItems = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, tone: "primary" as const },
    { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, tone: "accent" as const },
    { label: "Expert Instructors", value: stats.totalInstructors, icon: GraduationCap, tone: "default" as const },
    { label: "Success Rate", value: stats.successRate, icon: TrendingUp, tone: "warning" as const },
  ];

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          eyebrow="TechHub outcomes"
          title={title}
          description="A business learning community built around measurable course progress, practical skills, and instructor guidance."
          className="mx-auto mb-12 max-w-3xl text-center sm:items-center"
        />
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {metricItems.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  tone={item.tone}
                />
              ))}
            </div>  
          </div>
          
          <div className="relative">
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80"
                alt="Learning community"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
