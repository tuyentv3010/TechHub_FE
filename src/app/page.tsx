import Header from "@/components/organisms/Header";
import HeroSection from "@/components/organisms/HeroSection";
import CompaniesSection from "@/components/organisms/CompaniesSection";
import FeaturedCoursesSection from "@/components/organisms/FeaturedCoursesSection";
import CategoriesSection from "@/components/organisms/CategoriesSection";
import BenefitsSection from "@/components/organisms/BenefitsSection";
import TopicsSection from "@/components/organisms/TopicsSection";
import SiteFooter from "@/components/organisms/SiteFooter";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <CompaniesSection />
      <FeaturedCoursesSection />
      <CategoriesSection />
      <BenefitsSection />
      <TopicsSection />
      <SiteFooter />
    </main>
  );
}
