"use client";

import { useTranslations } from "next-intl";
import { useGetCourseList } from "@/queries/useCourse";
import { useGetPublicInstructors } from "@/queries/useAccount";

// Import new components
import { HeroSection } from "@/components/organisms/HeroSection";
import { CategoriesSection } from "@/components/organisms/NewCategoriesSection";
import { CoursesGridSection } from "@/components/organisms/CoursesGridSection";
import { LearningPathsSection } from "@/components/organisms/LearningPathsSection";
import { SkillsSection } from "@/components/organisms/NewSkillsSection";
import { CommunitySection } from "@/components/organisms/CommunitySectionNew";
import { InstructorsSection } from "@/components/organisms/InstructorsSection";
import { BlogSection } from "@/components/organisms/BlogSection";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

export default function Home() {
  const t = useTranslations("HomePage");
  
  // Fetch courses from API (limit to 6 for homepage)
  const { data: coursesData, isLoading } = useGetCourseList({
    page: 0,
    size: 6,
    status: "PUBLISHED", // Only show published courses
    redirectOnUnauthorized: false,
  });

  // Fetch instructors from public API (limit to 4)
  const { data: instructorsData, isLoading: isLoadingInstructors } = useGetPublicInstructors(0, 4);

  // Transform API data - keep instructorId for fetching
  const coursesWithInstructorIds = coursesData?.payload?.data?.map((course: any) => ({
    id: course.id, // Add course ID for creating slug
    title: course.title,
    description: course.description,
    instructorId: course.instructorId, // Keep ID for fetching
    image: normalizePersistedMediaUrl(course.thumbnail?.secureUrl || course.thumbnail?.url) || null,
    rating: course.averageRating || 0,
    reviews: course.ratingCount || 0,
    price: course.discountPrice || course.price || 0,
    originalPrice: course.price || 0,
    currency: course.currency,
    badge: course.categories?.[0] || "",
    level: course.level,
    language: course.language,
    hours: 0, // Will be calculated from lessons if needed
    lectures: 0, // Will be calculated from lessons if needed
    lessons: 0, // Will be calculated from chapters if needed
    students: course.totalEnrollments || 0,
    skills: course.skills || [],
    promoEndDate: course.promoEndDate,
    createdAt: course.created,
  })) || [];
  const communityStats = {
    totalStudents: t("community.stats.totalStudents"),
    totalCourses: t("community.stats.totalCourses"), 
    totalInstructors: t("community.stats.totalInstructors"),
    successRate: t("community.stats.successRate"),
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSection
        welcomeText={t("hero.welcomeText")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        buttonText={t("hero.buttonText")}
        instructorCount={t("hero.instructorCount")}
        instructorText={t("hero.instructorText")}
        instructors={instructorsData?.payload?.data || []}
      />

      {/* Categories Section */}
      <CategoriesSection
        title={t("categories.title")}
        variant="orbit"
      />

      {/* Courses Section */}
      {isLoading ? (
        <section className="bg-app-subtle py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div className="h-10 w-64 animate-pulse rounded bg-muted" />
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="h-48 animate-pulse bg-muted" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : coursesWithInstructorIds.length > 0 ? (
        <CoursesGridSection
          title={t("coursesSection.title")}
          viewAllText={t("coursesSection.viewAll")}
          coursesWithInstructorIds={coursesWithInstructorIds}
        />
      ) : (
        <section className="bg-app-subtle py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-muted-foreground">No courses available at the moment.</p>
            </div>
          </div>
        </section>
      )}

      {/* Learning Paths Section */}
      <LearningPathsSection />

      {/* Skills Section */}
      <SkillsSection
        title={t("skillsSection.title")}
        subtitle={t("skillsSection.subtitle")}
        description={t("skillsSection.description")}
        buttonText={t("skillsSection.buttonText")}
        yearsText={t("skillsSection.yearsText")}
        experienceText={t("skillsSection.experienceText")}
        feature1Title={t("skillsSection.feature1Title")}
        feature1Description={t("skillsSection.feature1Description")}
        feature2Title={t("skillsSection.feature2Title")}
        feature2Description={t("skillsSection.feature2Description")}
      />

      {/* Call to Action */}


      {/* Community Section */}
      <CommunitySection
        title={t("community.title")}
        stats={communityStats}
      />

      {/* Instructors Section */}
      {isLoadingInstructors ? (
        <section className="bg-app-subtle py-16">
          <div className="container mx-auto px-4">
            <div className="mb-4 h-10 w-64 animate-pulse rounded bg-muted" />
            <div className="mb-12 h-6 w-96 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="h-80 animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <InstructorsSection
          title={t("instructors.title")}
          subtitle={t("instructors.subtitle")}
          instructors={instructorsData?.payload?.data || []}
        />
      )}

      {/* Blog Section */}
      <BlogSection
        title={t("blog.title")}
        subtitle={t("blog.mostPopular")}
      />

    </div>
  );
}
