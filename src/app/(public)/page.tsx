import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import envConfig from "@/config";
import { htmlToTextForDescription } from "@/lib/utils";

// Import new components
import { HeroSection } from "@/components/organisms/HeroSection";
import { CategoriesSection } from "@/components/organisms/NewCategoriesSection";
import { CoursesGridSection } from "@/components/organisms/CoursesGridSection";
import { SkillsSection } from "@/components/organisms/NewSkillsSection";
import { CallToActionSection } from "@/components/organisms/CallToActionSection";
import { CommunitySection } from "@/components/organisms/CommunitySectionNew";
import { InstructorsSection } from "@/components/organisms/InstructorsSection";
import { BlogSection } from "@/components/organisms/BlogSection";
import { NewsletterSection } from "@/components/organisms/NewsletterSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HomePage");
  return {
    title: t("hero.title"),
    description: htmlToTextForDescription(t("hero.subtitle")),
    alternates: {
      canonical: envConfig.NEXT_PUBLIC_URL,
    },
  };
}

export default async function Home() {
  const t = await getTranslations("HomePage");
  
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

  const mockCourses = [
    {
      title: "Complete Web Development Bootcamp",
      instructor: "John Doe",
      image: "/course1.jpg",
      rating: 4.5,
      reviews: 1234,
      price: 99.99,
      badge: "Bestseller",
      hours: 40,
      lectures: 120,
    },
    {
      title: "Advanced React Development",
      instructor: "Jane Smith",
      image: "/course2.jpg", 
      rating: 4.8,
      reviews: 856,
      price: 79.99,
      hours: 30,
      lectures: 85,
    },
    {
      title: "Python for Data Science",
      instructor: "Mike Johnson",
      image: "/course3.jpg",
      rating: 4.6,
      reviews: 2341,
      price: 89.99,
      badge: "Hot",
      hours: 35,
      lectures: 95,
    },
  ];

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
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        searchPlaceholder={t("hero.searchPlaceholder")}
        searchButtonText={t("hero.searchButton")}
      />

      {/* Categories Section */}
      <CategoriesSection
        title={t("categories.title")}
        categories={categories}
      />

      {/* Courses Section */}
      <CoursesGridSection
        title={t("coursesSection.title")}
        viewAllText={t("coursesSection.viewAll")}
        courses={mockCourses}
      />

      {/* Skills Section */}
      <SkillsSection
        title={t("skillsSection.title")}
        description={t("skillsSection.description")}
        buttonText={t("skillsSection.learnMore")}
      />

      {/* Call to Action */}
      <CallToActionSection
        phoneText={t("callToAction.phone")}
        phoneNumber={t("callToAction.phoneNumber")}
      />

      {/* Community Section */}
      <CommunitySection
        title={t("community.title")}
        stats={communityStats}
      />

      {/* Instructors Section */}
      <InstructorsSection
        title={t("instructors.title")}
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
    </div>
  );
}
