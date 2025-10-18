import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  welcomeText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  instructorCount: string;
  instructorText: string;
}

export function HeroSection({
  welcomeText,
  title,
  subtitle,
  buttonText,
  instructorCount,
  instructorText,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[700px] bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-purple-100 dark:bg-purple-800/30 rounded-full opacity-60"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full opacity-60"></div>
        <div className="absolute bottom-32 left-32 w-8 h-8 bg-pink-100 dark:bg-pink-800/30 rounded-full opacity-60"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Welcome text */}
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
                {welcomeText}
              </p>
              
              {/* Main title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                {title}
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                {subtitle}
              </p>
            </div>
            
            {/* CTA Button with decorative arrow */}
            <div className="relative">
              <Button 
                size="lg"
                className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {/* Decorative dotted line */}
              <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-8">
                <svg width="200" height="100" viewBox="0 0 200 100" className="text-gray-300 dark:text-gray-600">
                  <path
                    d="M10 50 Q100 20 190 50"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                  />
                  <path
                    d="M180 45 L190 50 L180 55"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Right content */}
          <div className="relative">
            {/* Instructor count card */}
            <div className="absolute top-8 right-8 lg:right-16 z-20 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {instructorCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {instructorText}
                  </div>
                </div>
                
                {/* Instructor avatars */}
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">B</span>
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">C</span>
                  </div>
                  <div className="w-10 h-10 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">D</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-900 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm">+</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main hero image */}
            <div className="relative w-full h-[500px] lg:h-[600px]">
              <Image
                src="/hero/hero.png"
                alt="Students in library"
                fill
                className="object-cover rounded-2xl"
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

