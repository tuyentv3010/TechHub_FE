import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SkillsSectionProps {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  yearsText: string;
  experienceText: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
}

export function SkillsSection({ 
  title, 
  subtitle, 
  description, 
  buttonText, 
  yearsText, 
  experienceText,
  feature1Title,
  feature1Description,
  feature2Title,
  feature2Description
}: SkillsSectionProps) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background decorative element */}
      <div className="absolute top-10 right-10 text-purple-200 dark:text-purple-800">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 10L60 40L90 40L68 58L78 88L50 70L22 88L32 58L10 40L40 40Z"/>
        </svg>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content - Images */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Top left image */}
              <div className="relative h-48 rounded-2xl overflow-hidden">
                <Image
                  src="/skills/instructor-office.png"
                  alt="Instructor in office"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Top right image */}
              <div className="relative h-48 rounded-2xl overflow-hidden">
                <Image
                  src="/skills/building-exterior.png"
                  alt="Building exterior"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Bottom image spanning both columns */}
              <div className="col-span-2 relative h-56 rounded-2xl overflow-hidden">
                <Image
                  src="/skills/team-meeting.png"
                  alt="Team meeting"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Center floating badge */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-orange-400 dark:bg-orange-500 text-white p-6 rounded-full shadow-2xl text-center min-w-[140px]">
                <div className="text-3xl font-bold mb-1">{yearsText}</div>
                <div className="text-sm font-medium leading-tight">{experienceText}</div>
              </div>
            </div>
          </div>
          
          {/* Right content */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <p className="text-purple-600 dark:text-purple-400 font-medium mb-3 uppercase tracking-wider text-sm">
                {subtitle}
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                {title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  {feature1Title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {feature1Description}
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  {feature2Title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {feature2Description}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-medium text-lg shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}