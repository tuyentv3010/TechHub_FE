import { popularTags } from "@/constants/homeData";
import Button from "@/components/atoms/Button";

export function HeroSection() {
  return (
    <section className="bg-gray-50 py-14 px-6 md:px-12 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">A broad selection of courses</h1>
        <p className="text-lg md:text-xl text-gray-600 mt-5">Choose from many online video courses with new additions published every month</p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {popularTags.map(tag => (
            <Button key={tag} variant="pill" size="sm" className="text-xs md:text-sm">{tag}</Button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

