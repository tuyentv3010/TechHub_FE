import { HeroSearch } from "@/components/molecules/HeroSearch";
import Image from "next/image";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchButtonText: string;
}

export function HeroSection({
  title,
  subtitle,
  searchPlaceholder,
  searchButtonText,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-200 dark:bg-yellow-600 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute bottom-32 left-20 w-12 h-12 bg-pink-200 dark:bg-pink-700 rounded-full opacity-50"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {subtitle}
            </p>
            <div className="mb-8">
              <HeroSearch 
                placeholder={searchPlaceholder}
                buttonText={searchButtonText}
              />
            </div>
          </div>
          
          {/* Right image */}
          <div className="relative">
            <div className="relative w-full h-[400px] lg:h-[500px]">
              <Image
                src="/hero-students.jpg"
                alt="Education illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

