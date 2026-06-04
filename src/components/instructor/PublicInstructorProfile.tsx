"use client";

import { useCallback, useMemo } from "react";
import { BookOpen, Users, Star, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import CourseCard from "@/components/molecules/CourseCard";
import type { Course } from "@/types/course";
import {
  compactNumber,
  type InstructorAccount,
  type InstructorProfile,
} from "@/types/instructor";
import { InstructorHero, type HeroStat } from "@/components/instructor/InstructorHero";
import { AboutSection } from "@/components/instructor/AboutSection";
import { ProfileTabs, type ProfileTab } from "@/components/instructor/ProfileTabs";
import { CvTimeline } from "@/components/instructor/CvTimeline";
import { ProjectCard } from "@/components/instructor/ProjectCard";
import { CertificateCard } from "@/components/instructor/CertificateCard";
import { EmptyState, SectionShell, ProfileSkeleton } from "@/components/instructor/ProfileStates";
import { tFallback } from "@/lib/i18n-fallback";

interface Props {
  account: InstructorAccount;
  profile: InstructorProfile;
  courses: Course[];
  isLoading?: boolean;
  coverImageUrl?: string;
}

/** Redesigned public instructor profile (hero + stats + sticky tabs + courses + CV). */
export function PublicInstructorProfile({ account, profile, courses, isLoading, coverImageUrl }: Props) {
  const t = useTranslations("instructor");
  const tr = useCallback(
    (key: string, fallback: string) => tFallback(t, "instructor", key, fallback),
    [t],
  );

  const experience = profile.experience ?? [];
  const education = profile.education ?? [];
  const projects = (profile.projects ?? []).filter((p) => p?.name);
  const certs = (profile.cvCertifications ?? profile.certificates ?? []).filter((c) => c?.name);

  const stats = useMemo<HeroStat[]>(() => {
    if (!courses?.length) return [];
    const students = courses.reduce((a, c) => a + (Number(c.students) || 0), 0);
    const rated = courses.filter((c) => Number(c.rating) > 0);
    const avg = rated.length ? rated.reduce((a, c) => a + Number(c.rating), 0) / rated.length : 0;
    const out: HeroStat[] = [
      { icon: BookOpen, value: courses.length, label: tr("stats.courses", "Khóa học") },
    ];
    if (students > 0) out.push({ icon: Users, value: compactNumber(students), label: tr("stats.students", "Học viên") });
    if (avg > 0) out.push({ icon: Star, value: avg.toFixed(1), label: tr("stats.rating", "Đánh giá TB") });
    if (profile.yearsOfExperience != null)
      out.push({ icon: Briefcase, value: `${profile.yearsOfExperience}+`, label: tr("stats.years", "Năm KN") });
    return out;
  }, [courses, profile.yearsOfExperience, tr]);

  const tabs = useMemo<ProfileTab[]>(() => {
    const list: ProfileTab[] = [{ id: "courses", label: tr("tabs.courses", "Khóa học"), count: courses?.length ?? 0 }];
    if (experience.length) list.push({ id: "experience", label: tr("tabs.experience", "Kinh nghiệm"), count: experience.length });
    if (education.length) list.push({ id: "education", label: tr("tabs.education", "Học vấn"), count: education.length });
    if (projects.length) list.push({ id: "projects", label: tr("tabs.projects", "Dự án"), count: projects.length });
    if (certs.length) list.push({ id: "certifications", label: tr("tabs.certifications", "Chứng chỉ"), count: certs.length });
    return list;
  }, [courses, experience.length, education.length, projects.length, certs.length, tr]);

  if (isLoading) return <ProfileSkeleton />;

  return (
    <article>
      <InstructorHero account={account} profile={profile} stats={stats} coverImageUrl={coverImageUrl} />

      <div className="mx-auto max-w-[var(--content-max,1180px)] px-6 pb-20">
        <AboutSection profile={profile} />
        <ProfileTabs tabs={tabs} />

        {/* Primary content: courses */}
        <SectionShell id="courses" title={tr("tabs.courses", "Khóa học")} count={courses?.length ?? 0}>
          {courses?.length ? (
            <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={tr("empty.courses.title", "Chưa có khóa học nào được xuất bản")}
              body={tr("empty.courses.body", "Giảng viên này hiện chưa xuất bản khóa học. Hãy quay lại sau nhé!")}
            />
          )}
        </SectionShell>

        {experience.length > 0 && (
          <SectionShell id="experience" title={tr("tabs.experience", "Kinh nghiệm")} count={experience.length}>
            <CvTimeline
              variant="experience"
              items={experience.map((e) => ({
                title: e.title,
                subtitle: e.company,
                location: e.location,
                startDate: e.startDate,
                endDate: e.endDate,
                description: e.description,
              }))}
            />
          </SectionShell>
        )}

        {education.length > 0 && (
          <SectionShell id="education" title={tr("tabs.education", "Học vấn")} count={education.length}>
            <CvTimeline
              variant="education"
              items={education.map((e) => ({
                title: e.degree,
                subtitle: e.school,
                startDate: e.startDate,
                endDate: e.endDate,
                description: e.description,
              }))}
            />
          </SectionShell>
        )}

        {projects.length > 0 && (
          <SectionShell id="projects" title={tr("tabs.projects", "Dự án")} count={projects.length}>
            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              {projects.map((p, i) => (
                <ProjectCard key={i} project={p} />
              ))}
            </div>
          </SectionShell>
        )}

        {certs.length > 0 && (
          <SectionShell id="certifications" title={tr("tabs.certifications", "Chứng chỉ")} count={certs.length}>
            <div className="flex flex-col gap-3">
              {certs.map((c, i) => (
                <CertificateCard key={i} cert={c} />
              ))}
            </div>
          </SectionShell>
        )}
      </div>
    </article>
  );
}

export default PublicInstructorProfile;
