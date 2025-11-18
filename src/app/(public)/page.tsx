"use client";

import { useTranslations } from "next-intl";
import { useGetCourseList } from "@/queries/useCourse";

// Import new components
import { HeroSection } from "@/components/organisms/HeroSection";
import { CategoriesSection } from "@/components/organisms/NewCategoriesSection";
import { CoursesGridSection } from "@/components/organisms/CoursesGridSection";
import { LearningPathsSection } from "@/components/organisms/LearningPathsSection";
import { SkillsSection } from "@/components/organisms/NewSkillsSection";
import { CommunitySection } from "@/components/organisms/CommunitySectionNew";
import { InstructorsSection } from "@/components/organisms/InstructorsSection";
import { BlogSection } from "@/components/organisms/BlogSection";
import { NewsletterSection } from "@/components/organisms/NewsletterSection";
import Footer from "@/components/footer";
import { Course } from "@/components/molecules/CourseCard";

export default function Home() {
  const t = useTranslations("HomePage");
  
  // Fetch courses from API (limit to 6 for homepage)
  const { data: coursesData, isLoading } = useGetCourseList({
    page: 0,
    size: 6,
    status: "PUBLISHED", // Only show published courses
  });
  
  // Mock data - in real app, this would come from API
  const categories = [
    { title: t("categories.webDesign"), icon: "🎨", bgColor: "bg-blue-100" },
    { title: t("categories.dataScience"), icon: "📊", bgColor: "bg-green-100" },
    { title: t("categories.businessDevelopment"), icon: "💼", bgColor: "bg-purple-100" },
    { title: t("categories.personalDevelopment"), icon: "🧠", bgColor: "bg-yellow-100" },
    { title: t("categories.itAndSoftware"), icon: "💻", bgColor: "bg-red-100" },
    { title: t("categories.graphicDesign"), icon: "🎭", bgColor: "bg-indigo-100" },
    { title: t("categories.digitalMarketing"), icon: "📱", bgColor: "bg-pink-100" },
    { title: t("categories.newsAndPhotography"), icon: "📷", bgColor: "bg-orange-100" },
  ];

  // Transform API data - keep instructorId for fetching
  const coursesWithInstructorIds = coursesData?.payload?.data?.map((course: any) => ({
    id: course.id, // Add course ID for creating slug
    title: course.title,
    instructorId: course.instructorId, // Keep ID for fetching
    image: course.thumbnail?.secureUrl || course.thumbnail?.url || "/courses/default.png",
    rating: course.averageRating || 0,
    reviews: course.ratingCount || 0,
    price: course.discountPrice || course.price || 0,
    badge: course.categories?.[0] || "",
    hours: 0, // Will be calculated from lessons if needed
    lectures: 0, // Will be calculated from lessons if needed
    lessons: 0, // Will be calculated from chapters if needed
    students: course.totalEnrollments || 0,
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
      />

      {/* Categories Section */}
      <CategoriesSection
        title={t("categories.title")}
        categories={categories}
      />

      {/* Courses Section */}
      {isLoading ? (
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">No courses available at the moment.</p>
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
      <InstructorsSection
        title={t("instructors.title")}
        subtitle={t("instructors.subtitle")}
      />

      {/* Blog Section */}
      <BlogSection
        title={t("blog.title")}
        subtitle={t("blog.mostPopular")}
      />

      {/* Newsletter Section */}
      <NewsletterSection
        title={t("newsletter.title")}
        placeholder={t("newsletter.placeholder")}
        buttonText={t("newsletter.subscribe")}
      />
      <Footer />

    </div>
  );
}
