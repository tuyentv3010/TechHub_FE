import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import envConfig from "@/config";
import { htmlToTextForDescription } from "@/lib/utils";

// Import new components
import { HeroSection } from "@/components/organisms/HeroSection";
import { CategoriesSection } from "@/components/organisms/NewCategoriesSection";
import { CoursesGridSection } from "@/components/organisms/CoursesGridSection";
import { SkillsSection } from "@/components/organisms/NewSkillsSection";
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
      title: "IT Statistics Data Science And Business Analysis",
      instructor: "Samantha",
      image: "/courses/data-science.png",
      rating: 4.5,
      reviews: 4500,
      price: 50.00,
      badge: "Digital Marketing",
      hours: 19,
      lectures: 120,
      lessons: 10,
      students: 20,
      instructorAvatar: "/avatars/samantha.jpg"
    },
    {
      title: "Advanced React Development",
      instructor: "Jane Smith",
      image: "/courses/react-course.png", 
      rating: 4.8,
      reviews: 856,
      price: 79.99,
      badge: "Web Development",
      hours: 30,
      lectures: 85,
      lessons: 15,
      students: 50,
      instructorAvatar: "/avatars/jane.jpg"
    },
    {
      title: "Python for Data Science",
      instructor: "Mike Johnson",
      image: "/courses/python-course.png",
      rating: 4.6,
      reviews: 2341,
      price: 89.99,
      badge: "Data Science",
      hours: 35,
      lectures: 95,
      lessons: 12,
      students: 100,
      instructorAvatar: "/avatars/mike.jpg"
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
      <CoursesGridSection
        title={t("coursesSection.title")}
        viewAllText={t("coursesSection.viewAll")}
        courses={mockCourses}
      />

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
    </div>
  );
}
